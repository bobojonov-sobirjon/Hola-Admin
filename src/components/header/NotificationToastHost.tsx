import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  isDriverIdentificationInReview,
  markNotificationRead,
  resolveNotificationPath,
  subscribeNotifications,
  type AppNotification,
} from "../../services/wsNotifications";

type ToastItem = {
  key: string;
  notification: AppNotification;
  path: string;
};

export default function NotificationToastHost() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeNotifications((n) => {
      if (!isDriverIdentificationInReview(n)) return;

      const path = resolveNotificationPath(n);
      const key = `toast-${n.id}-${Date.now()}`;
      setToasts((prev) => [{ key, notification: n, path }, ...prev].slice(0, 4));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key));
      }, 8000);
    });
  }, []);

  function dismiss(key: string) {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }

  function open(item: ToastItem) {
    void markNotificationRead(item.notification.id).catch(() => undefined);
    dismiss(item.key);
    navigate(item.path);
  }

  if (!toasts.length) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[300000] flex flex-col items-end gap-3 px-4 sm:px-6">
      {toasts.map((t) => {
        const title =
          t.notification.title || "Driver identification submitted";
        const message =
          t.notification.message ||
          "Driver sent documents for review (in_review)";
        const driverId = Number(
          (t.notification.data as any)?.driver_id ??
            (t.notification.data as any)?.driverId ??
            t.notification.relatedObjectId
        );

        return (
          <div
            key={t.key}
            className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-amber-400/30 bg-gray-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="bg-gradient-to-r from-amber-500/15 via-transparent to-brand-500/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2a7 7 0 0 0-7 7v3.1l-1.4 2.8A1 1 0 0 0 4.5 17h15a1 1 0 0 0 .9-1.1L19 12.1V9a7 7 0 0 0-7-7zm0 20a3 3 0 0 0 2.8-2h-5.6A3 3 0 0 0 12 22z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-0.5 text-xs text-white/60">{message}</div>
                  {Number.isFinite(driverId) ? (
                    <div className="mt-1 text-[11px] text-amber-200/80">
                      Driver #{driverId} · in_review
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => open(t)}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                    >
                      Open verification
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(t.key)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
