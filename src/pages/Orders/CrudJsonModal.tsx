import { useEffect, useMemo, useState } from "react";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getErrorMessage } from "../../config/api";

export default function CrudJsonModal({
  isOpen,
  onClose,
  title,
  initialJson,
  submitText,
  busyText,
  submitting,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialJson: unknown;
  submitText: string;
  busyText: string;
  submitting: boolean;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const initialText = useMemo(() => {
    try {
      return initialJson ? JSON.stringify(initialJson, null, 2) : "{\n\n}";
    } catch {
      return "{\n\n}";
    }
  }, [initialJson]);

  const [text, setText] = useState(initialText);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setText(initialText);
    setErr(null);
  }, [isOpen, initialText]);

  function parse(): Record<string, unknown> | null {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        setErr("JSON must be an object { ... }");
        return null;
      }
      setErr(null);
      return obj as Record<string, unknown>;
    } catch (e) {
      setErr(getErrorMessage(e));
      return null;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[920px] m-4">
      <div className="no-scrollbar relative w-full max-w-[920px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Fill JSON body for this action
          </p>
        </div>

        {err && (
          <div className="mx-2 mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {err}
          </div>
        )}

        <div className="px-2">
          <Label>JSON body</Label>
          <textarea
            className="min-h-[260px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 justify-end">
          <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={() => {
              const body = parse();
              if (!body) return;
              void onSubmit(body);
            }}
          >
            {submitting ? busyText : submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

