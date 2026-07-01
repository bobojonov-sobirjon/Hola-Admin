import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import {
  deleteJson,
  getAuthHeaders,
  getErrorMessage,
  getJson,
  patchFormData,
  patchJson,
} from "../../config/api";
import {
  type ApiDetailEnvelope,
  formatDate,
  YesNoBadge,
} from "../Accounts/AdminPanelCommon";

type LegalDoc = {
  id: number;
  document_type?: string;
  document_type_display?: string;
  title?: string;
  content_format?: string;
  content_format_display?: string;
  html_content?: string;
  pdf_file?: string | null;
  pdf_file_url?: string | null;
  open_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

function formatApiError(err: unknown) {
  const base = getErrorMessage(err);
  if (err && typeof err === "object") {
    const e = err as { errors?: Record<string, string[]> };
    if (e.errors && typeof e.errors === "object") {
      const parts = Object.entries(e.errors).flatMap(([k, v]) =>
        (Array.isArray(v) ? v : [String(v)]).map((m) => `${k}: ${m}`)
      );
      if (parts.length) return parts.join("; ");
    }
  }
  return base;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{value}</div>
    </div>
  );
}

export default function LoginLegalDocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const [item, setItem] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);

  const [editTitle, setEditTitle] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editPdf, setEditPdf] = useState<File | null>(null);

  const basePath = `admin-panel/login-legal-documents/${id}/`;

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<LegalDoc>>(basePath, {
        headers: getAuthHeaders(),
      });
      const data = res.data ?? null;
      setItem(data);
      setEditTitle(data?.title ?? "");
      setEditHtml(data?.html_content ?? "");
      setEditActive(!!data?.is_active);
      setEditPdf(null);
      if (pdfRef.current) pdfRef.current.value = "";
    } catch (e) {
      setError(formatApiError(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!id || !item) return;
    setError(null);
    setSaving(true);
    try {
      if (item.content_format === "pdf" && editPdf) {
        const fd = new FormData();
        fd.append("title", editTitle.trim());
        fd.append("content_format", "pdf");
        fd.append("pdf_file", editPdf);
        fd.append("is_active", editActive ? "true" : "false");
        await patchFormData<unknown>(basePath, fd, { headers: getAuthHeaders() });
      } else {
        await patchJson<unknown>(
          basePath,
          {
            title: editTitle.trim(),
            html_content: editHtml,
            is_active: editActive,
          },
          { headers: getAuthHeaders() }
        );
      }
      closeModal();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id) return;
    if (!window.confirm("Delete this legal document?")) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(basePath, { headers: getAuthHeaders() });
      navigate("/site-settings/login-legal-documents");
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const isHtml = item?.content_format === "html";
  const isPdf = item?.content_format === "pdf";

  return (
    <>
      <PageMeta title="Legal document details" description="Login legal document details" />
      <PageBreadcrumb pageTitle="Legal document details" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/site-settings/login-legal-documents"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to list
        </Link>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={openModal}>
            Edit
          </Button>
          <Button size="sm" variant="outline" disabled={deleting} onClick={() => void remove()}>
            {deleting ? "Deleting..." : "Delete"}
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
          <ComponentCard title={item.title || "Document"} desc="">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="Document type" value={item.document_type_display || item.document_type || "-"} />
              <Info
                label="Content format"
                value={
                  <Badge size="sm" color="info">
                    {item.content_format_display || item.content_format || "-"}
                  </Badge>
                }
              />
              <Info label="Active" value={<YesNoBadge value={!!item.is_active} />} />
              <Info label="Created" value={formatDate(item.created_at)} />
              <Info label="Updated" value={formatDate(item.updated_at)} />
              {item.open_url ? (
                <div className="md:col-span-2">
                  <Info
                    label="Open URL (public)"
                    value={
                      <a
                        href={item.open_url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-brand-500 hover:underline"
                      >
                        {item.open_url}
                      </a>
                    }
                  />
                </div>
              ) : null}
            </div>
          </ComponentCard>

          {isHtml && item.html_content ? (
            <ComponentCard title="HTML preview" desc="">
              <div
                className="prose prose-sm max-w-none rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03] dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: item.html_content }}
              />
            </ComponentCard>
          ) : null}

          {isPdf && item.pdf_file_url ? (
            <ComponentCard title="PDF" desc="">
              <a
                href={item.pdf_file_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand-500 hover:underline"
              >
                Open PDF file
              </a>
            </ComponentCard>
          ) : null}
        </div>
      ) : null}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[820px] m-4">
        <div className="no-scrollbar relative w-full max-w-[820px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit legal document
            </h4>
          </div>
          <form
            className="flex flex-col gap-5 px-2"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div>
              <Label>Title *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            {isHtml ? (
              <div>
                <Label>HTML content</Label>
                <textarea
                  className="min-h-[160px] w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label>Replace PDF (optional)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Choose file
                    <input
                      ref={pdfRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => setEditPdf(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {editPdf ? editPdf.name : "No file chosen"}
                  </span>
                </div>
              </div>
            )}
            <div>
              <Label>Active</Label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                value={editActive ? "true" : "false"}
                onChange={(e) => setEditActive(e.target.value === "true")}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pb-2">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" disabled={saving || !editTitle.trim()} onClick={() => void save()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
