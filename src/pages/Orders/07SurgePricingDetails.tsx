import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import SurgeZoneMapPicker from "../../components/surge/SurgeZoneMapPicker";
import { useModal } from "../../hooks/useModal";
import {
  deleteJson,
  getAuthHeaders,
  getErrorMessage,
  getJson,
  patchJson,
} from "../../config/api";
import CrudFormModal from "./CrudFormModal";
import {
  flattenPrimitiveFields,
  formatDate,
  isDateLikeKey,
  prettyFieldName,
  pickTitleLike,
  type ApiDetailEnvelope,
} from "./OrdersAdminCommon";
import {
  SURGE_FORM_FIELDS,
  surgeItemToFormValues,
} from "./surgePricingFields";

type AnyObj = Record<string, unknown>;

const HIDDEN_DETAIL_KEYS = new Set([
  "latitude",
  "longitude",
  "radius_km",
]);

export default function SurgePricingDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editModal = useModal(false);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<AnyObj>>(
        `admin-panel/surge-pricings/${id}/`,
        { headers: getAuthHeaders() }
      );
      setItem(res.data ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function save(body: AnyObj) {
    if (!id) return;
    setError(null);
    setSaving(true);
    try {
      await patchJson<ApiDetailEnvelope<AnyObj>>(
        `admin-panel/surge-pricings/${id}/`,
        body,
        { headers: getAuthHeaders() }
      );
      editModal.closeModal();
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id) return;
    const ok = window.confirm("Delete this surge pricing?");
    if (!ok) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(`admin-panel/surge-pricings/${id}/`, {
        headers: getAuthHeaders(),
      });
      window.location.href = "/orders/surge-pricings";
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const fields = useMemo(
    () =>
      item
        ? flattenPrimitiveFields(item).filter((f) => !HIDDEN_DETAIL_KEYS.has(f.key))
        : [],
    [item]
  );

  const editInitial = useMemo(
    () => (item ? surgeItemToFormValues(item) : undefined),
    [item]
  );

  return (
    <>
      <PageMeta title="Surge Pricing" description="Surge Pricing" />
      <PageBreadcrumb pageTitle="Surge Pricing" />

      <div className="mb-4">
        <Link
          to="/orders/surge-pricings"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to list
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
          <ComponentCard title={pickTitleLike(item)} desc="Surge pricing details">
            <div className="flex flex-wrap justify-end gap-3">
              <Button size="sm" variant="outline" onClick={editModal.openModal}>
                Edit
              </Button>
              <Button size="sm" disabled={deleting} onClick={() => void remove()}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Surge zone" desc="Map preview of the active area">
            <SurgeZoneMapPicker
              readOnly
              latitude={String(item.latitude ?? "")}
              longitude={String(item.longitude ?? "")}
              radiusKm={String(item.radius_km ?? "")}
            />
          </ComponentCard>

          <ComponentCard title="Fields" desc="Key information">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {prettyFieldName(f.key)}
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {isDateLikeKey(f.key) ? formatDate(f.value) : f.value}
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      ) : null}

      <CrudFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        title="Edit Surge Pricing"
        initialValues={editInitial}
        fields={SURGE_FORM_FIELDS}
        submitText="Save"
        busyText="Saving..."
        submitting={saving}
        onSubmit={save}
      />
    </>
  );
}
