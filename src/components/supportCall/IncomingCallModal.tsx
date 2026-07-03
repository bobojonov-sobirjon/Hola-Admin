import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCallRingtone } from "../../hooks/useCallRingtone";
import { useSupportCallOptional } from "../../context/SupportCallContext";
import { formatCallType } from "../../services/voiceCallTypes";

function displayCallerName(fullName?: string | null, email?: string | null) {
  const name = fullName?.trim();
  if (name && name.toLowerCase() !== "string") return name;
  if (email?.trim()) return email.trim();
  return "Unknown caller";
}

function callerInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function CallActionButton({
  label,
  tone,
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone: "reject" | "accept";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const toneClass =
    tone === "accept"
      ? "bg-success-500 hover:bg-success-600 shadow-success-500/30"
      : "bg-error-500 hover:bg-error-600 shadow-error-500/30";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex flex-col items-center gap-2 disabled:opacity-50"
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 ${toneClass}`}
      >
        {children}
      </span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </button>
  );
}

export default function IncomingCallModal() {
  const ctx = useSupportCallOptional();
  const open = Boolean(ctx?.enabled && ctx.incomingCall && !ctx.activeCall);
  useCallRingtone(open);

  if (!ctx?.enabled || !ctx.incomingCall || ctx.activeCall || !open) return null;

  const call = ctx.incomingCall;
  const callerName = displayCallerName(call.caller?.full_name, call.caller?.email);
  const initials = callerInitials(callerName);
  const callLabel = formatCallType(call.call_type);
  const orderLabel = call.order_id ? `Order #${call.order_id}` : null;

  return createPortal(
    <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-950/75 backdrop-blur-md"
        onClick={() => void ctx.rejectIncoming("busy")}
      />

      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-success-500/10 blur-3xl" />

        <div className="relative px-8 pb-8 pt-10 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            Incoming support call
          </div>

          <div className="relative mx-auto mb-6 mt-8 flex h-32 w-32 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/15" />
            <span className="absolute -inset-3 rounded-full border border-brand-400/20" />
            <span className="absolute -inset-6 rounded-full border border-brand-400/10" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-3xl font-bold text-white shadow-[0_20px_40px_rgba(70,95,255,0.35)]">
              {initials}
            </div>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight text-white">{callerName}</h3>
          <p className="mt-2 text-sm text-gray-400">
            {callLabel}
            {orderLabel ? ` · ${orderLabel}` : ""}
          </p>
          {call.caller?.email && callerName !== call.caller.email ? (
            <p className="mt-1 text-xs text-gray-500">{call.caller.email}</p>
          ) : null}

          {ctx.error ? (
            <div className="mt-5 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-left text-sm text-error-200">
              {ctx.error}
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-center gap-14">
            <CallActionButton
              label="Reject"
              tone="reject"
              disabled={ctx.actionLoading}
              onClick={() => void ctx.rejectIncoming("busy")}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 9l6-6m0 0h-4.5M21 3v4.5M9 15l-6 6m0 0v-4.5M3 21h4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </CallActionButton>

            <CallActionButton
              label={ctx.actionLoading ? "Connecting..." : "Accept"}
              tone="accept"
              disabled={ctx.actionLoading}
              onClick={() => void ctx.acceptIncoming()}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 0 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1 16 16 0 0 0-16 16 1 1 0 0 0 1 1h3.5a1 1 0 0 0 1-1c0-1.25.2-2.46.57-3.58a1 1 0 0 0-.24-1.01l-2.2-2.2z" />
              </svg>
            </CallActionButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
