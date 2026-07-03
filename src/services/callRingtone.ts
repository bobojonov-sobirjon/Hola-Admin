let audioContext: AudioContext | null = null;
let intervalId: number | null = null;
let running = false;

function getAudioContext() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

function playBeep() {
  if (!audioContext || audioContext.state === "closed") return;
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.35);
  } catch {
    // ignore
  }
}

export function startCallRingtone() {
  if (running) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  audioContext = ctx;
  running = true;

  playBeep();
  intervalId = window.setInterval(playBeep, 900);
}

export function stopCallRingtone() {
  running = false;
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  const ctx = audioContext;
  audioContext = null;
  if (ctx && ctx.state !== "closed") {
    void ctx.close().catch(() => undefined);
  }
}

export function isCallRingtonePlaying() {
  return running;
}
