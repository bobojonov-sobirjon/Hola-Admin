import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function FieldHelpTip({ text }: { text: string }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function show() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 280;
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - 12
    );
    setPos({ top: rect.bottom + 8, left });
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        role="button"
        aria-label="Field help"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex h-[18px] w-[18px] cursor-help items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-[11px] font-bold leading-none text-gray-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
      >
        ?
      </span>
      {open
        ? createPortal(
            <div
              role="tooltip"
              style={{ top: pos.top, left: pos.left, width: 280 }}
              className="pointer-events-none fixed z-[200000] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs leading-snug text-gray-600 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
