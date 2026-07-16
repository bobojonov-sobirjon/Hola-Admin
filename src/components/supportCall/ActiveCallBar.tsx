import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSupportCallOptional } from "../../context/SupportCallContext";
import { formatCallType } from "../../services/voiceCallTypes";
import {
  getLocalMicLevel,
  isAgoraConnected,
  isLocalMicMuted,
  setLocalMicMuted,
} from "../../services/agoraVoiceCall";

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function displayCallerName(fullName?: string | null, email?: string | null) {
  const name = fullName?.trim();
  if (name && name.toLowerCase() !== "string") return name;
  if (email?.trim()) return email.trim();
  return "Caller";
}

function callerInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) {
    const local = parts[0].includes("@") ? parts[0].split("@")[0] : parts[0];
    return local.slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const MIC_BARS = 12;

function MicLevelMeter({ level, muted }: { level: number; muted: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden>
      {Array.from({ length: MIC_BARS }, (_, i) => {
        const threshold = (i + 1) / MIC_BARS;
        const active = !muted && level >= threshold * 0.85;
        const tall = i % 3 === 1 ? 20 : i % 3 === 2 ? 14 : 10;
        return (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-all duration-75 ${
              muted
                ? "bg-white/15"
                : active
                  ? "bg-gradient-to-t from-cyan-400 to-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]"
                  : "bg-white/20"
            }`}
            style={{ height: `${tall}px`, opacity: active ? 1 : 0.45 }}
          />
        );
      })}
    </div>
  );
}

export default function ActiveCallBar() {
  const ctx = useSupportCallOptional();
  const [seconds, setSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [agoraReady, setAgoraReady] = useState(false);

  useEffect(() => {
    if (!ctx?.activeCall) {
      setSeconds(0);
      return;
    }
    const started = ctx.activeCall.answered_at
      ? new Date(ctx.activeCall.answered_at).getTime()
      : Date.now();
    const tick = () => {
      setSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [ctx?.activeCall]);

  useEffect(() => {
    if (!ctx?.activeCall) {
      setMicLevel(0);
      setMuted(false);
      setAgoraReady(false);
      return;
    }

    const timer = window.setInterval(() => {
      setAgoraReady(isAgoraConnected());
      setMuted(isLocalMicMuted());
      setMicLevel(getLocalMicLevel());
    }, 80);

    return () => window.clearInterval(timer);
  }, [ctx?.activeCall]);

  if (!ctx?.enabled || !ctx.activeCall) return null;

  const call = ctx.activeCall;
  const callerName = displayCallerName(call.caller?.full_name, call.caller?.email);
  const initials = callerInitials(callerName);
  const connecting = ctx.actionLoading && !agoraReady;
  const micPct = Math.round(micLevel * 100);

  async function toggleMute() {
    const next = !muted;
    await setLocalMicMuted(next);
    setMuted(next);
  }

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[200001] flex justify-center p-4 pointer-events-none sm:p-6">
      <div className="pointer-events-auto w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1220]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.12),transparent_50%)]" />

        <div className="relative px-5 pb-5 pt-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
              {connecting ? "Connecting…" : "Live support call"}
            </span>
            <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-white/70">
              {formatDuration(seconds)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                className="absolute -inset-1 rounded-full opacity-70 transition-all duration-100"
                style={{
                  boxShadow: muted
                    ? "0 0 0 2px rgba(248,113,113,0.35)"
                    : `0 0 0 ${2 + micLevel * 6}px rgba(52,211,153,${0.15 + micLevel * 0.35})`,
                }}
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-base font-bold text-white shadow-lg shadow-emerald-500/25">
                {initials}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold tracking-tight text-white">
                {callerName}
              </div>
              <div className="mt-0.5 text-sm text-white/50">
                {formatCallType(call.call_type)}
                {call.order_id ? ` · Order #${call.order_id}` : ""}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                </svg>
                {muted ? "Mic muted" : agoraReady ? "Mic level" : "Waiting for audio…"}
              </div>
              <span className="font-mono text-[11px] text-white/40">
                {muted ? "—" : `${micPct}%`}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-75 ${
                  muted
                    ? "bg-error-500/50"
                    : "bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300"
                }`}
                style={{ width: muted ? "8%" : `${Math.max(4, micPct)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <MicLevelMeter level={micLevel} muted={muted} />
              <button
                type="button"
                disabled={!agoraReady || ctx.actionLoading}
                onClick={() => void toggleMute()}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-40 ${
                  muted
                    ? "border-error-400/40 bg-error-500/20 text-error-200 hover:bg-error-500/30"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              disabled={ctx.actionLoading}
              onClick={() => void ctx.endActiveCall("resolved")}
              className="group flex flex-col items-center gap-1.5 disabled:opacity-50"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-error-400 to-error-600 text-white shadow-[0_12px_30px_rgba(239,68,68,0.45)] transition-transform group-hover:scale-105 group-active:scale-95">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28H1.5A.5.5 0 0 1 1 15.35v-2.5c0-.28.11-.54.31-.74C4.1 9.35 7.85 8 12 8s7.9 1.35 10.69 4.11c.2.2.31.46.31.74v2.5a.5.5 0 0 1-.5.5h-1.98c-.27 0-.52-.1-.7-.28a11.2 11.2 0 0 0-2.66-1.85.99.99 0 0 1-.56-.9v-3.1A12.7 12.7 0 0 0 12 9z" />
                </svg>
              </span>
              <span className="text-[11px] font-medium text-white/70">
                {ctx.actionLoading ? "Ending…" : "End call"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
