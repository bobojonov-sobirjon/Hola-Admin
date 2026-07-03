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
