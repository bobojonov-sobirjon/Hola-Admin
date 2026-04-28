import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
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
import { getAuthHeaders, getErrorMessage, getJson, postFormData } from "../../config/api";
import { type ApiListEnvelope, formatDate } from "./AdminPanelCommon";

type UploadType = {
  id: number;
  title?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export default function UploadDriverIdentificationList() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createActive, setCreateActive] = useState(true);
  const [createIcon, setCreateIcon] = useState<File | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<UploadType>>(
        "admin-panel/upload-driver-identification/",
        { headers: getAuthHeaders() }
      );
      setItems(res.data ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const count = useMemo(() => items.length, [items]);

  async function create() {
    setError(null);
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("title", createTitle.trim());
      if (createDescription.trim()) fd.append("description", createDescription.trim());
      fd.append("is_active", createActive ? "true" : "false");
      if (createIcon) fd.append("icon", createIcon);

      await postFormData<unknown>("admin-panel/upload-driver-identification/", fd, {
        headers: getAuthHeaders(),
      });

      setCreateTitle("");
      setCreateDescription("");
      setCreateActive(true);
      setCreateIcon(null);
      closeModal();
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageMeta title="Upload — driver identification" description="Upload types" />
      <PageBreadcrumb pageTitle="Upload — driver identification" />

      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={openModal}>
          Create
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[820px] m-4">
        <div className="no-scrollbar relative w-full max-w-[820px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Create upload type
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Add a new upload type
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <div className="grid grid-cols-1 gap-5 px-2 pb-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Title *</Label>
                <Input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Take a photo of your Driver's License"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Upload a clear photo"
                />
              </div>
              <div>
                <Label>is_active</Label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                  value={createActive ? "true" : "false"}
                  onChange={(e) => setCreateActive(e.target.value === "true")}
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
                  onChange={(e) => setCreateIcon(e.target.files?.[0] ?? null)}
                />
                <div className="flex h-11 items-center gap-3 rounded-lg border border-gray-300 bg-transparent px-3 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose file
                  </Button>
                  <span className="truncate text-gray-600 dark:text-gray-400">
                    {createIcon?.name ?? "No file chosen"}
                  </span>
                  {createIcon && (
                    <button
                      type="button"
                      className="ml-auto text-xs font-medium text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                      onClick={() => {
                        setCreateIcon(null);
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
              <Button
                size="sm"
                disabled={creating || !createTitle.trim()}
                onClick={() => void create()}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ComponentCard title={`Upload types (${count})`} desc="Click a row to open details.">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
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
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      #
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Title
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Updated
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => (
                    <TableRow
                      key={it.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() => navigate(`/accounts/upload-driver-licenses/${it.id}`)}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.title ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(it.updated_at || it.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No items.
                      </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
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

