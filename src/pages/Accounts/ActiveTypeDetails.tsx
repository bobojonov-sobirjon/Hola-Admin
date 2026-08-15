import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { deleteJson, getAuthHeaders, getErrorMessage, getJson, patchJson } from "../../config/api";
import { useModal } from "../../hooks/useModal";
import { type ActiveItem, type ApiDetailEnvelope, YesNoBadge, formatDate } from "./AdminPanelCommon";

export default function ActiveTypeDetails({
  title,
  breadcrumb,
  listRoute,
  apiBasePath,
  deleteEntityLabel = "item",
}: {
  title: string;
  breadcrumb: string;
  listRoute: string;
  apiBasePath: string; // e.g. "admin-panel/legal-driver-identification"
  deleteEntityLabel?: string;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const deleteModal = useModal(false);
  const [item, setItem] = useState<ActiveItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titleField, setTitleField] = useState("");
  const [descriptionField, setDescriptionField] = useState("");
  const [activeField, setActiveField] = useState(true);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<ActiveItem>>(`${apiBasePath}/${id}/`, {
        headers: getAuthHeaders(),
      });
      const it = res.data ?? null;
      setItem(it);
      setTitleField((it?.title ?? "").toString());
      setDescriptionField((it?.description ?? "").toString());
      setActiveField(!!it?.is_active);
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
      await patchJson<ApiDetailEnvelope<ActiveItem>>(
        `${apiBasePath}/${id}/`,
        {
          title: titleField,
          description: descriptionField,
          is_active: activeField,
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

  async function deactivate() {
    if (!id) return;
    setError(null);
    setSaving(true);
    try {
      await patchJson<ApiDetailEnvelope<ActiveItem>>(
        `${apiBasePath}/${id}/`,
        { is_active: false },
        { headers: getAuthHeaders() }
      );
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(`${apiBasePath}/${id}/`, { headers: getAuthHeaders() });
      deleteModal.closeModal();
      navigate(listRoute);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    load();
  }, [id, apiBasePath]);

  return (
    <>
      <PageMeta title={title} description={breadcrumb} />
      <PageBreadcrumb pageTitle={breadcrumb} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to={listRoute}
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to list
        </Link>
        {item ? (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto !text-error-600 hover:!text-error-700 dark:!text-error-400"
            onClick={deleteModal.openModal}
          >
            Delete
          </Button>
        ) : null}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={() => void remove()}
        deleting={deleting}
        entityLabel={deleteEntityLabel}
        displayName={item?.title?.trim() || (id ? `ID ${id}` : undefined)}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : item ? (
        <div className="space-y-6">
          <ComponentCard title="Current">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
                <div className="mt-1">
                  <YesNoBadge value={!!item.is_active} />
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-xs text-gray-500 dark:text-gray-400">Updated</div>
                <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(item.updated_at || item.created_at)}
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Update" desc="Edit details or deactivate.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input
                  type="text"
                  value={titleField}
                  onChange={(e) => setTitleField(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <TextArea
                  rows={5}
                  value={descriptionField}
                  onChange={(value) => setDescriptionField(value)}
                  placeholder="Description"
                />
              </div>
              <div>
                <Label>is_active</Label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={activeField ? "true" : "false"}
                  onChange={(e) => setActiveField(e.target.value === "true")}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => void deactivate()}
              >
                Deactivate
              </Button>
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

