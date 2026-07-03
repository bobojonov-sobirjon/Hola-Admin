import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Badge from "../../components/ui/badge/Badge";
import {
  deleteJson,
  getAuthHeaders,
  getErrorMessage,
  getJson,
  postFormData,
  postJson,
} from "../../config/api";
import {
  type ApiListEnvelope,
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

export default function LoginLegalDocumentsList() {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<LegalDoc | null>(null);
  const { isOpen, openModal, closeModal } = useModal(false);
  const deleteModal = useModal(false);

  const [documentType, setDocumentType] = useState<"privacy_policy" | "terms_of_service">(
    "privacy_policy"
  );
  const [title, setTitle] = useState("");
  const [contentFormat, setContentFormat] = useState<"html" | "pdf">("html");
  const [htmlContent, setHtmlContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  const listPath = "admin-panel/login-legal-documents/";

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<LegalDoc>>(listPath, {
        headers: getAuthHeaders(),
      });
      setItems(res.data ?? []);
    } catch (e) {
      setError(formatApiError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const count = useMemo(() => items.length, [items]);

  function resetForm() {
    setDocumentType("privacy_policy");
    setTitle("");
    setContentFormat("html");
    setHtmlContent("");
    setPdfFile(null);
    setIsActive(true);
    if (pdfRef.current) pdfRef.current.value = "";
  }

  async function create() {
    setError(null);
    setCreating(true);
    try {
      if (contentFormat === "html") {
        await postJson<unknown>(
          listPath,
          {
            document_type: documentType,
            title: title.trim(),
            content_format: "html",
            html_content: htmlContent,
            is_active: isActive,
          },
          { headers: getAuthHeaders() }
        );
      } else {
        const fd = new FormData();
        fd.append("document_type", documentType);
        fd.append("title", title.trim());
        fd.append("content_format", "pdf");
        fd.append("is_active", isActive ? "true" : "false");
        if (pdfFile) fd.append("pdf_file", pdfFile);
        await postFormData<unknown>(listPath, fd, { headers: getAuthHeaders() });
      }
      resetForm();
      closeModal();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deletingItem?.id) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(`${listPath}${deletingItem.id}/`, {
        headers: getAuthHeaders(),
      });
      deleteModal.closeModal();
      setDeletingItem(null);
      await load();
    } catch (e) {
      deleteModal.closeModal();
      setError(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageMeta title="Login legal documents" description="Login legal documents" />
      <PageBreadcrumb pageTitle="Login legal documents" />

      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={openModal}>
          Create
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[820px] m-4">
        <div className="no-scrollbar relative w-full max-w-[820px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Create legal document
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Privacy Policy or Terms of Service for login screen
            </p>
          </div>
          <form
            className="flex flex-col gap-5 px-2"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Document type *</Label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(e.target.value as "privacy_policy" | "terms_of_service")
                  }
                >
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="terms_of_service">Terms of Service</option>
                </select>
              </div>
              <div>
                <Label>Content format *</Label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={contentFormat}
                  onChange={(e) => setContentFormat(e.target.value as "html" | "pdf")}
                >
                  <option value="html">HTML / Rich text</option>
                  <option value="pdf">PDF file</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Privacy Policy"
                />
              </div>
              {contentFormat === "html" ? (
                <div className="md:col-span-2">
                  <Label>HTML content *</Label>
                  <textarea
                    className="min-h-[160px] w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<h1>Privacy Policy</h1><p>...</p>"
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <Label>PDF file *</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      Choose file
                      <input
                        ref={pdfRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {pdfFile ? pdfFile.name : "No file chosen"}
                    </span>
                    {pdfFile ? (
                      <button
                        type="button"
                        className="text-sm text-brand-500"
                        onClick={() => {
                          setPdfFile(null);
                          if (pdfRef.current) pdfRef.current.value = "";
                        }}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
              <div>
                <Label>Active</Label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={isActive ? "true" : "false"}
                  onChange={(e) => setIsActive(e.target.value === "true")}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pb-2">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={creating || !title.trim() || (contentFormat === "pdf" && !pdfFile)}
                onClick={() => void create()}
              >
                {creating ? "Saving..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingItem(null);
        }}
        onConfirm={() => void confirmDelete()}
        deleting={deleting}
        entityLabel="legal document"
        displayName={deletingItem?.title?.trim() || (deletingItem?.id ? `ID ${deletingItem.id}` : undefined)}
      />

      <ComponentCard title={`Login legal documents (${count})`} desc="">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {["#", "Title", "Type", "Format", "Active", "Updated", "Actions"].map((h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => (
                    <TableRow
                      key={it.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() =>
                        navigate(`/site-settings/login-legal-documents/${it.id}`)
                      }
                    >
                      <TableCell className="px-5 py-4 text-theme-sm">{idx + 1}</TableCell>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {it.title || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                        {it.document_type_display || it.document_type || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                        <Badge size="sm" color="info">
                          {it.content_format_display || it.content_format || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <YesNoBadge value={!!it.is_active} />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                        {formatDate(it.updated_at)}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <button
                          type="button"
                          className="text-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingItem(it);
                            deleteModal.openModal();
                          }}
                        >
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500" colSpan={7}>
                        No documents.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}
