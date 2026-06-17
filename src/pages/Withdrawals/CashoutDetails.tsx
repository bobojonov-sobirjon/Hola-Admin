import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { getAuthHeaders, getErrorMessage, getJson, patchJson } from "../../config/api";

type Cashout = Record<string, unknown> & {
  id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type ApiDetailEnvelope<T> = { data?: T };

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <Badge size="sm" color="success">completed</Badge>;
  if (s === "failed") return <Badge size="sm" color="error">failed</Badge>;
  return <Badge size="sm" color="warning">{s || "-"}</Badge>;
}

function safe(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v.trim() ? v : "-";
  return String(v);
}

export default function CashoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Cashout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<"" | "pending" | "completed" | "failed">("");

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<Cashout>>(
        `admin-panel/driver-cashouts/${id}/`,
        { headers: getAuthHeaders() }
      );
      setItem(res.data ?? null);
      const st = (res.data?.status as any) ?? "";
      setNextStatus(st ? (String(st) as any) : "");
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus() {
    if (!id || !nextStatus) return;
    setError(null);
    setSaving(true);
    try {
      await patchJson<unknown>(
        `admin-panel/driver-cashouts/${id}/`,
        { status: nextStatus },
        { headers: getAuthHeaders() }
      );
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const title = useMemo(() => {
    if (!id) return "Cash out details";
    return `Cash out #${id}`;
  }, [id]);

  return (
    <>
      <PageMeta title="Cash out details" description="Cash out details" />
      <PageBreadcrumb pageTitle="Cash out details" />

      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/withdrawal/cash-outs"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to cash outs
        </Link>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={() => navigate(0)}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : item ? (
        <div className="space-y-6">
          <ComponentCard title={title} desc="">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Status:</span>
              {statusBadge(String(item.status ?? ""))}
              <span className="ml-auto">
                Created: {item.created_at ? new Date(String(item.created_at)).toLocaleString() : "-"}
              </span>
            </div>
          </ComponentCard>

          <ComponentCard title="Update status" desc="">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-[220px]">
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "pending", label: "pending" },
                    { value: "completed", label: "completed" },
                    { value: "failed", label: "failed" },
                  ]}
                  defaultValue={String(nextStatus || item.status || "pending")}
                  onChange={(v) => setNextStatus(v as any)}
                />
              </div>
              <Button size="sm" disabled={saving || !nextStatus} onClick={() => void updateStatus()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Details" desc="">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(item)
                .filter(([k]) => !["id"].includes(k))
                .map(([k, v]) => (
                  <Info
                    key={k}
                    label={prettyKey(k)}
                    value={k.toLowerCase().includes("at") ? formatMaybeDate(v) : safe(v)}
                  />
                ))}
            </div>
          </ComponentCard>
        </div>
      ) : null}
    </>
  );
}

function prettyKey(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatMaybeDate(v: unknown) {
  if (!v) return "-";
  try {
    return new Date(String(v)).toLocaleString();
  } catch {
    return String(v);
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{value}</div>
    </div>
  );
}

