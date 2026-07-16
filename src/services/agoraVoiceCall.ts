import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ILocalAudioTrack,
} from "agora-rtc-sdk-ng";
import type { AgoraCredentials } from "./voiceCallTypes";

let client: IAgoraRTCClient | null = null;
let localAudio: ILocalAudioTrack | null = null;
let remoteUsersWithAudio = 0;
const subscribedAudioUids = new Set<number>();

async function playRemoteAudio(user: IAgoraRTCRemoteUser) {
  const track = user.audioTrack;
  if (!track) return;
  track.setVolume(100);
  await track.play();
  remoteUsersWithAudio += 1;
}

async function subscribeRemoteUser(user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") {
  if (!client) return;
  const uid = Number(user.uid);
  if (mediaType === "audio" && subscribedAudioUids.has(uid)) return;

  await client.subscribe(user, mediaType);
  if (mediaType === "audio") {
    subscribedAudioUids.add(uid);
    await playRemoteAudio(user);
  }
}

async function subscribeExistingRemoteUsers() {
  if (!client) return;
  for (const user of client.remoteUsers) {
    if (user.hasAudio) {
      try {
        await subscribeRemoteUser(user, "audio");
      } catch {
        // ignore per-user failures
      }
    }
  }
}

function attachClientListeners(c: IAgoraRTCClient) {
  c.on("user-published", async (user, mediaType) => {
    try {
      if (mediaType === "audio") {
        await subscribeRemoteUser(user, "audio");
      }
    } catch (err) {
      console.error("[agora] user-published subscribe failed", err);
    }
  });

  c.on("user-unpublished", (user, mediaType) => {
    if (mediaType === "audio") {
      subscribedAudioUids.delete(Number(user.uid));
      remoteUsersWithAudio = Math.max(0, remoteUsersWithAudio - 1);
      try {
        user.audioTrack?.stop();
      } catch {
        // ignore
      }
    }
  });

  c.on("user-left", () => {
    remoteUsersWithAudio = Math.max(0, remoteUsersWithAudio - 1);
  });
}

export async function joinAgoraVoiceCall(agora: AgoraCredentials) {
  await leaveAgoraVoiceCall();

  remoteUsersWithAudio = 0;
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  attachClientListeners(client);

  await client.join(
    agora.app_id,
    agora.channel_name,
    agora.token,
    agora.uid
  );

  // Caller may already be in channel and publishing before admin accepts.
  await subscribeExistingRemoteUsers();

  localAudio = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudio]);
}

export async function leaveAgoraVoiceCall() {
  try {
    if (localAudio && client) {
      await client.unpublish([localAudio]);
    }
  } catch {
    // ignore
  }

  try {
    if (localAudio) {
      localAudio.stop();
      localAudio.close();
    }
  } catch {
    // ignore
  }
  localAudio = null;

  try {
    if (client) {
      client.removeAllListeners();
      await client.leave();
    }
  } catch {
    // ignore
  }
  client = null;
  remoteUsersWithAudio = 0;
  subscribedAudioUids.clear();
}

export function isAgoraConnected() {
  return Boolean(client);
}

export function isRemoteAudioActive() {
  return remoteUsersWithAudio > 0;
}

/** Local mic volume 0–1 while published; 0 if not in a call. */
export function getLocalMicLevel() {
  if (!localAudio) return 0;
  try {
    return Math.min(1, Math.max(0, localAudio.getVolumeLevel()));
  } catch {
    return 0;
  }
}

export function isLocalMicMuted() {
  return Boolean(localAudio && !localAudio.enabled);
}

export async function setLocalMicMuted(muted: boolean) {
  if (!localAudio) return;
  await localAudio.setEnabled(!muted);
}
