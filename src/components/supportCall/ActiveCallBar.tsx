import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSupportCallOptional } from "../../context/SupportCallContext";
import { formatCallType } from "../../services/voiceCallTypes";

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

export default function ActiveCallBar() {
  const ctx = useSupportCallOptional();
  const [seconds, setSeconds] = useState(0);

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

  if (!ctx?.enabled || !ctx.activeCall) return null;

  const call = ctx.activeCall;
  const callerName = displayCallerName(call.caller?.full_name, call.caller?.email);
  const connecting = ctx.actionLoading;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[200001] flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-success-500/30 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-500/20">
            <span className="absolute inset-0 animate-ping rounded-full bg-success-500/30" />
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="relative text-success-400"
              aria-hidden
            >
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 0 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1 16 16 0 0 0-16 16 1 1 0 0 0 1 1h3.5a1 1 0 0 0 1-1c0-1.25.2-2.46.57-3.58a1 1 0 0 0-.24-1.01l-2.2-2.2z" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-success-400">
              {connecting ? "Connecting audio..." : "On call"}
            </div>
            <div className="truncate text-lg font-semibold text-white">{callerName}</div>
            <div className="text-sm text-gray-400">
              {formatCallType(call.call_type)} · {formatDuration(seconds)}
            </div>
          </div>

          <button
            type="button"
            disabled={ctx.actionLoading}
            onClick={() => void ctx.endActiveCall("resolved")}
            className="flex shrink-0 flex-col items-center gap-1 disabled:opacity-50"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-500 text-white shadow-lg shadow-error-500/30 transition-transform hover:bg-error-600 active:scale-95">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 9l6-6m0 0h-4.5M21 3v4.5M9 15l-6 6m0 0v-4.5M3 21h4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[11px] font-medium text-white/80">
              {ctx.actionLoading ? "Ending..." : "End call"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
