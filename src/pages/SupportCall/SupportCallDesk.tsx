import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useSupportCall } from "../../context/SupportCallContext";
import { fetchVoiceCalls } from "../../services/voiceCallApi";
import {
  formatCallType,
  type VoiceCallRecord,
} from "../../services/voiceCallTypes";
import { getErrorMessage } from "../../config/api";

export default function SupportCallDesk() {
  const call = useSupportCall();
  const [ringing, setRinging] = useState<VoiceCallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRinging() {
    if (!call.enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVoiceCalls({ status: "ringing", page_size: 20 });
      setRinging(res.data ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
      setRinging([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRinging();
    const timer = window.setInterval(loadRinging, 15000);
    return () => window.clearInterval(timer);
  }, [call.enabled, call.isOnDuty]);

  return (
    <>
      <PageMeta title="Support Call" description="Support call operator desk" />
      <PageBreadcrumb pageTitle="Support Call" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant={call.isOnDuty ? "primary" : "outline"}
          disabled={call.dutyLoading || Boolean(call.activeCall)}
          onClick={() => void call.setOnDuty(!call.isOnDuty)}
        >
          {call.dutyLoading
            ? "Updating..."
            : call.isOnDuty
              ? "On duty — receiving calls"
              : "Go on duty"}
        </Button>
        <Badge size="sm" color={call.wsConnected ? "success" : "warning"}>
          WebSocket {call.wsConnected ? "connected" : "disconnected"}
        </Badge>
        <Link
          to="/support-call/history"
          className="ml-auto text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          View call history →
        </Link>
      </div>

      {call.error ? (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {call.error}
        </div>
      ) : null}

      {call.activeCall ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-success-500/30 bg-gradient-to-r from-success-50 to-white p-5 dark:from-success-950/20 dark:to-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-success-600 dark:text-success-400">
                Active support call
              </div>
              <div className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                {call.activeCall.caller?.full_name ||
                  call.activeCall.caller?.email ||
                  `Call #${call.activeCall.id}`}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatCallType(call.activeCall.call_type)}
                {call.activeCall.order_code ? ` · ${call.activeCall.order_code}` : ""}
              </div>
            </div>
            <Button
              disabled={call.actionLoading}
              onClick={() => void call.endActiveCall("resolved")}
            >
              {call.actionLoading ? "Ending call..." : "End call"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Operator status" desc="Duty and live call">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              Duty:{" "}
              <strong className="text-gray-800 dark:text-white/90">
                {call.isOnDuty ? "On duty" : "Off duty"}
              </strong>
            </div>
            <div>
              Active call:{" "}
              <strong className="text-gray-800 dark:text-white/90">
                {call.activeCall
                  ? `#${call.activeCall.id} — ${call.activeCall.caller?.full_name || "Caller"}`
                  : "None"}
              </strong>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Turn on duty to connect WebSocket and receive incoming rider/driver support calls.
            </p>
          </div>
        </ComponentCard>

        <ComponentCard title="Ringing now" desc="Waiting support calls">
          {error ? (
            <div className="mb-3 text-sm text-error-600 dark:text-error-400">{error}</div>
          ) : null}
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : ringing.length ? (
            <ul className="space-y-3">
              {ringing.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {item.caller?.full_name || item.caller?.email || `Call #${item.id}`}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatCallType(item.call_type)}
                    {item.order_code ? ` · ${item.order_code}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No ringing calls.</div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
