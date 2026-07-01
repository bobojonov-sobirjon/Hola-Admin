import { useEffect, useMemo, useState } from "react";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import SurgeZoneMapPicker from "../../components/surge/SurgeZoneMapPicker";
import FieldHelpTip from "../../components/common/FieldHelpTip";
import { getErrorMessage } from "../../config/api";

type FieldHelp = { help?: string };

export type FieldDef =
  | ({ key: string; label: string; type: "text"; placeholder?: string } & FieldHelp)
  | ({ key: string; label: string; type: "number"; placeholder?: string } & FieldHelp)
  | ({ key: string; label: string; type: "time"; placeholder?: string } & FieldHelp)
  | ({ key: string; label: string; type: "checkbox" } & FieldHelp)
  | ({
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      placeholder?: string;
    } & FieldHelp)
  | ({
      key: string;
      label: string;
      type: "array-number";
      placeholder?: string;
      hint?: string;
    } & FieldHelp)
  | ({
      key: string;
      label: string;
      type: "surge-zone-map";
      latKey: string;
      lngKey: string;
      radiusKey: string;
      zoneNameKey?: string;
    } & FieldHelp);

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <Label className="mb-0">{label}</Label>
      {help ? <FieldHelpTip text={help} /> : null}
    </div>
  );
}

function toInitialState(fields: FieldDef[], initial: Record<string, unknown> | null) {
  const st: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "surge-zone-map") {
      for (const key of [f.latKey, f.lngKey, f.radiusKey]) {
        const v = initial ? initial[key] : undefined;
        st[key] = v === null || v === undefined ? "" : String(v);
      }
      continue;
    }
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
    if (f.type === "surge-zone-map") {
      body[f.latKey] = String(st[f.latKey] ?? "");
      body[f.lngKey] = String(st[f.lngKey] ?? "");
      body[f.radiusKey] = String(st[f.radiusKey] ?? "");
      continue;
    }
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
    if (f.type === "time") {
      const s = String(raw ?? "").trim();
      body[f.key] = s ? (s.length === 5 ? `${s}:00` : s) : "";
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[980px] h-[calc(100dvh-2rem)]"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-100 px-4 pt-4 pr-14 pb-4 lg:px-8 lg:pt-8 dark:border-white/[0.06]">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill fields for this action
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 lg:px-8">
          {err && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.key}
              className={
                f.type === "checkbox" || f.type === "surge-zone-map" ? "md:col-span-2" : ""
              }
            >
              <FieldLabel label={f.label} help={f.help} />
              {f.type === "surge-zone-map" ? (
                <div className="pt-2">
                  <SurgeZoneMapPicker
                    compact
                    latitude={String(st[f.latKey] ?? "")}
                    longitude={String(st[f.lngKey] ?? "")}
                    radiusKm={String(st[f.radiusKey] ?? "")}
                    onChange={({ latitude, longitude, radius_km }) =>
                      setSt((p) => ({
                        ...p,
                        [f.latKey]: latitude,
                        [f.lngKey]: longitude,
                        [f.radiusKey]: radius_km,
                      }))
                    }
                    onSuggestZoneName={
                      f.zoneNameKey
                        ? (name) => {
                            setSt((p) => {
                              if (String(p[f.zoneNameKey!] ?? "").trim()) return p;
                              return { ...p, [f.zoneNameKey!]: name };
                            });
                          }
                        : undefined
                    }
                  />
                </div>
              ) : f.type === "checkbox" ? (
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
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-4 py-4 lg:px-8 dark:border-white/[0.06]">
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

