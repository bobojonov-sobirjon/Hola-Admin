import { useEffect, useMemo, useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { getErrorMessage } from "../../config/api";

export type FieldDef =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "number"; placeholder?: string }
  | { key: string; label: string; type: "time"; placeholder?: string }
  | { key: string; label: string; type: "checkbox" }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      placeholder?: string;
    }
  | { key: string; label: string; type: "array-number"; placeholder?: string; hint?: string };

function toInitialState(fields: FieldDef[], initial: Record<string, unknown> | null) {
  const st: Record<string, unknown> = {};
  for (const f of fields) {
    const v = initial ? initial[f.key] : undefined;
    if (f.type === "checkbox") {
      st[f.key] = typeof v === "boolean" ? v : false;
    } else if (f.type === "array-number") {
      if (Array.isArray(v)) st[f.key] = v.join(", ");
      else st[f.key] = typeof v === "string" ? v : "";
    } else if (f.type === "number") {
      st[f.key] = v === null || v === undefined ? "" : String(v);
    } else {
      st[f.key] = v === null || v === undefined ? "" : String(v);
    }
  }
  return st;
}

function buildBody(fields: FieldDef[], st: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = st[f.key];
    if (f.type === "checkbox") {
      body[f.key] = Boolean(raw);
      continue;
    }
    if (f.type === "array-number") {
      const s = String(raw ?? "").trim();
      if (!s) {
        body[f.key] = [];
        continue;
      }
      body[f.key] = s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));
      continue;
    }
    if (f.type === "number") {
      const s = String(raw ?? "").trim();
      body[f.key] = s === "" ? null : Number(s);
      continue;
    }
    body[f.key] = String(raw ?? "");
  }
  return body;
}

export default function CrudFormModal({
  isOpen,
  onClose,
  title,
  initialValues,
  fields,
  submitText,
  busyText,
  submitting,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialValues?: Record<string, unknown>;
  fields: FieldDef[];
  submitText: string;
  busyText: string;
  submitting: boolean;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const initialState = useMemo(
    () => toInitialState(fields, initialValues ?? null),
    [fields, initialValues]
  );

  const [st, setSt] = useState<Record<string, unknown>>(initialState);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSt(initialState);
    setErr(null);
  }, [isOpen, initialState]);

  function submit() {
    try {
      setErr(null);
      const body = buildBody(fields, st);
      void onSubmit(body);
    } catch (e) {
      setErr(getErrorMessage(e));
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
            Fill fields for this action
          </p>
        </div>

        {err && (
          <div className="mx-2 mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.type === "checkbox" ? "md:col-span-2" : ""}>
              <Label>{f.label}</Label>
              {f.type === "checkbox" ? (
                <div className="pt-2">
                  <Checkbox
                    checked={Boolean(st[f.key])}
                    onChange={(v) => setSt((p) => ({ ...p, [f.key]: v }))}
                    label={f.label}
                  />
                </div>
              ) : f.type === "select" ? (
                <Select
                  options={f.options}
                  placeholder={f.placeholder ?? "Select..."}
                  defaultValue={String(st[f.key] ?? "")}
                  onChange={(v) => setSt((p) => ({ ...p, [f.key]: v }))}
                />
              ) : (
                <Input
                  type={f.type === "time" ? "time" : f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder}
                  value={String(st[f.key] ?? "")}
                  onChange={(e) => setSt((p) => ({ ...p, [f.key]: e.target.value }))}
                  hint={f.type === "array-number" ? f.hint : undefined}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 justify-end">
          <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button size="sm" disabled={submitting} onClick={submit}>
            {submitting ? busyText : submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

