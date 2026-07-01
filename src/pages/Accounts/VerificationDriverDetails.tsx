import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  getAuthHeaders,
  getErrorMessage,
  getJson,
  patchJson,
} from "../../config/api";
import { type ApiDetailEnvelope, formatDate } from "./AdminPanelCommon";

type VerificationDriver = {
  id: number;
  status?: string;
  status_display?: string;
  comment?: string | null;
  estimated_review_hours?: number | null;
  reviewed_at?: string | null;
  reviewer?: string | null;
  user?: unknown;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

export default function VerificationDriverDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<VerificationDriver | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [estimated, setEstimated] = useState<string>("");

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<VerificationDriver>>(
        `admin-panel/verification-drivers/${id}/`,
        { headers: getAuthHeaders() }
      );
      const it = res.data ?? null;
      setItem(it);
      setStatus((it?.status ?? "").toString());
      setComment((it?.comment ?? "").toString());
      setEstimated(
        it?.estimated_review_hours !== null && it?.estimated_review_hours !== undefined
          ? String(it.estimated_review_hours)
          : ""
      );
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!id) return;
    setError(null);
    setSaving(true);
    try {
      await patchJson<ApiDetailEnvelope<VerificationDriver>>(
        `admin-panel/verification-drivers/${id}/`,
        {
          status: status || undefined,
          comment: comment || undefined,
          estimated_review_hours: estimated ? Number(estimated) : undefined,
        },
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

  return (
    <>
      <PageMeta title="Verification Details" description="Verification driver details" />
      <PageBreadcrumb pageTitle="Verification Details" />

      <div className="mb-4">
        <Link
          to="/site-settings/verification-drivers"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to Verification list
        </Link>
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
          <ComponentCard title="Current status">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                size="sm"
                color={
                  item.status === "approved"
                    ? "success"
                    : item.status === "rejected"
                      ? "error"
                      : "warning"
                }
              >
                {item.status_display || item.status || "-"}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Updated: {formatDate(item.updated_at || item.created_at)}
              </span>
            </div>
          </ComponentCard>

          <ComponentCard title="Update" desc="Edit status and notes.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Status</Label>
                <Input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g. not_submitted / pending / approved / rejected"
                />
              </div>
              <div>
                <Label>Estimated review hours</Label>
                <Input
                  type="number"
                  value={estimated}
                  onChange={(e) => setEstimated(e.target.value)}
                  placeholder="e.g. 48"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Comment</Label>
                <Input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </ComponentCard>
        </div>
      ) : null}
    </>
  );
}

