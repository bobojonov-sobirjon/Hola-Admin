import { useEffect, useMemo, useState } from "react";
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
import { getAuthHeaders, getErrorMessage, getJson, postJson } from "../../config/api";
import {
  type ActiveItem,
  type ApiListEnvelope,
  YesNoBadge,
  formatDate,
} from "./AdminPanelCommon";

export default function ActiveTypesList({
  title,
  breadcrumb,
  listPath,
  detailsBasePath,
  enableCreate = true,
}: {
  title: string;
  breadcrumb: string;
  listPath: string; // API path (relative to /api/v1/)
  detailsBasePath: string; // route base path
  enableCreate?: boolean;
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createActive, setCreateActive] = useState(true);
  const { isOpen, openModal, closeModal } = useModal(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<ActiveItem>>(listPath, {
        headers: getAuthHeaders(),
      });
      setItems(res.data ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!enableCreate) return;
    setError(null);
    setCreating(true);
    try {
      await postJson<unknown>(
        listPath,
        {
          title: createTitle.trim(),
          description: createDescription.trim(),
          is_active: createActive,
        },
        { headers: getAuthHeaders() }
      );
      setCreateTitle("");
      setCreateDescription("");
      setCreateActive(true);
      closeModal();
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    load();
  }, [listPath]);

  const count = useMemo(() => items.length, [items]);

  return (
    <>
      <PageMeta title={title} description={breadcrumb} />
      <PageBreadcrumb pageTitle={breadcrumb} />
      {enableCreate && (
        <div className="mb-6 flex justify-end">
          <Button size="sm" onClick={openModal}>
            Create
          </Button>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[720px] m-4">
        <div className="no-scrollbar relative w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Create new
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Add a new item
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
                <Label>Title</Label>
                <Input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Title"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Description"
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

      <ComponentCard title={`${breadcrumb} (${count})`} desc="Click a row to open details / update / deactivate.">
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
                      Active
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
                      onClick={() => navigate(`${detailsBasePath}/${it.id}`)}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.title ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        <YesNoBadge value={!!it.is_active} />
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

