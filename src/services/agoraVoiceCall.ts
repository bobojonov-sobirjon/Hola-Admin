import AgoraRTC, { type IAgoraRTCClient, type ILocalAudioTrack } from "agora-rtc-sdk-ng";
import type { AgoraCredentials } from "./voiceCallTypes";

let client: IAgoraRTCClient | null = null;
let localAudio: ILocalAudioTrack | null = null;

export async function joinAgoraVoiceCall(agora: AgoraCredentials) {
  await leaveAgoraVoiceCall();

  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(
    agora.app_id,
    agora.channel_name,
    agora.token,
    agora.uid
  );

  localAudio = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([localAudio]);
}

export async function leaveAgoraVoiceCall() {
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
      await client.leave();
    }
  } catch {
    // ignore
  }
  client = null;
}

export function isAgoraConnected() {
  return Boolean(client);
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
