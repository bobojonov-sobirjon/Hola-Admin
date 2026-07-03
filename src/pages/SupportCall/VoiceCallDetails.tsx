import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";
import { getErrorMessage } from "../../config/api";
import {
  fetchVoiceCall,
  saveVoiceCallNote,
} from "../../services/voiceCallApi";
import {
  formatCallStatus,
  formatCallType,
  type VoiceCallRecord,
} from "../../services/voiceCallTypes";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{value}</div>
    </div>
  );
}

export default function VoiceCallDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<VoiceCallRecord | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVoiceCall(Number(id));
      setItem(data);
      setNote(data?.operator_note || "");
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const res = await saveVoiceCallNote(item.id, note.trim());
      setItem(res.data ?? item);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <>
      <PageMeta title="Call details" description="Support call details" />
      <PageBreadcrumb pageTitle="Call details" />

      <div className="mb-4">
        <Link
          to="/support-call/history"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to history
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : item ? (
        <div className="space-y-6">
          <ComponentCard
            title={`Call #${item.id}`}
            desc={formatCallType(item.call_type)}
          >
            <div className="mb-4">
              <Badge size="sm" color="light">
                {formatCallStatus(item.status)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Caller"
                value={item.caller?.full_name || item.caller?.email || "—"}
              />
              <Field
                label="Callee"
                value={item.callee?.full_name || item.callee?.email || "—"}
              />
              <Field label="Order" value={item.order_code || String(item.order_id || "—")} />
              <Field
                label="Duration"
                value={
                  item.duration_seconds != null ? `${item.duration_seconds} sec` : "—"
                }
              />
              <Field
                label="Ring started"
                value={
                  item.ring_started_at
                    ? new Date(item.ring_started_at).toLocaleString()
                    : "—"
                }
              />
              <Field
                label="Answered"
                value={
                  item.answered_at ? new Date(item.answered_at).toLocaleString() : "—"
                }
              />
              <Field
                label="Ended"
                value={item.ended_at ? new Date(item.ended_at).toLocaleString() : "—"}
              />
              <Field
                label="Created"
                value={item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="Operator note" desc="Add notes after the call ends">
            <div className="space-y-3">
              <div>
                <Label>Operator note</Label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Rider complained about payment. Resolved."
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" disabled={saving} onClick={() => void saveNote()}>
                  {saving ? "Saving..." : "Save note"}
                </Button>
              </div>
            </div>
          </ComponentCard>
        </div>
      ) : null}
    </>
  );
}
