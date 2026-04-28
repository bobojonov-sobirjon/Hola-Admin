import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { getAuthHeaders, getErrorMessage, getJson, putFormData } from "../../config/api";
import { formatDate, type ApiDetailEnvelope, YesNoBadge } from "./AdminPanelCommon";

type UploadType = {
  id: number;
  title?: string;
  description?: string | null;
  display_type?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  items?: unknown;
  [key: string]: unknown;
};

function resolveMaybeMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export default function UploadDriverIdentificationDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<UploadType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editIcon, setEditIcon] = useState<File | null>(null);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<UploadType>>(
        `admin-panel/upload-driver-identification/${id}/`,
        { headers: getAuthHeaders() }
      );
      setItem(res.data ?? null);
      const next = res.data ?? null;
      setEditTitle(next?.title ?? "");
      setEditDescription(next?.description ?? "");
      setEditActive(!!next?.is_active);
      setEditIcon(null);
      if (fileRef.current) fileRef.current.value = "";
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
      const fd = new FormData();
      fd.append("title", editTitle.trim());
      if (editDescription.trim()) fd.append("description", editDescription.trim());
      fd.append("is_active", editActive ? "true" : "false");
      if (editIcon) fd.append("icon", editIcon);

      await putFormData<unknown>(`admin-panel/upload-driver-identification/${id}/`, fd, {
        headers: getAuthHeaders(),
      });

      closeModal();
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
      <PageMeta title="Upload type details" description="Upload driver identification details" />
      <PageBreadcrumb pageTitle="Upload type details" />

      <div className="mb-4">
        <Link
          to="/accounts/upload-driver-licenses"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to Upload types
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ComponentCard title={`Upload type #${item.id}`} desc="Details">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={openModal}>
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</div>
                <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {item.title ?? "-"}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Description
                </div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {item.description ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Display type
                </div>
                <div className="mt-1">
                  <Badge size="sm" color="info">
                    {item.display_type ?? "-"}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Active
                </div>
                <div className="mt-1">
                  <YesNoBadge value={!!item.is_active} />
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Created
                </div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {formatDate(item.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Updated
                </div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {formatDate(item.updated_at)}
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Icon" desc="Preview">
            {(() => {
              const url = resolveMaybeMediaUrl(item.icon_url ?? item.icon);
              if (!url) {
                return (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No icon.</div>
                );
              }
              return (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                  <img
                    src={url}
                    alt="icon"
                    className="h-40 w-full rounded-xl object-contain"
                  />
                </div>
              </div>
              );
            })()}
          </ComponentCard>
        </div>
      ) : null}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[920px] m-4">
        <div className="no-scrollbar relative w-full max-w-[920px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Update upload type
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Update details</p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-2 pb-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Title *</Label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
              />
            </div>

            <div>
              <Label>is_active</Label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                value={editActive ? "true" : "false"}
                onChange={(e) => setEditActive(e.target.value === "true")}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>

            <div>
              <Label>Icon (png/jpg)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => setEditIcon(e.target.files?.[0] ?? null)}
              />
              <div className="flex h-11 items-center gap-3 rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
                <span className="truncate text-gray-600 dark:text-gray-400">
                  {editIcon?.name ?? "No file chosen"}
                </span>
                {editIcon && (
                  <button
                    type="button"
                    className="ml-auto text-xs font-medium text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                    onClick={() => {
                      setEditIcon(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" disabled={saving || !editTitle.trim()} onClick={() => void save()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

