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
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { getAuthHeaders, getErrorMessage, getJson, postJson } from "../../config/api";
import { type ApiListEnvelope, formatDate } from "./AdminPanelCommon";

type VerificationDriver = {
  id: number;
  status?: string;
  status_display?: string;
  comment?: string | null;
  estimated_review_hours?: number | null;
  reviewed_at?: string | null;
  reviewer?: string | null;
  user?: { id?: number; email?: string } | number | null;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

export default function VerificationDriversList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VerificationDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);

  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [estimated, setEstimated] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<VerificationDriver>>(
        "admin-panel/verification-drivers/",
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
      await postJson<unknown>(
        "admin-panel/verification-drivers/",
        {
          user: userId ? Number(userId) : undefined,
          status: status || undefined,
          comment: comment || undefined,
          estimated_review_hours: estimated ? Number(estimated) : undefined,
        },
        { headers: getAuthHeaders() }
      );
      setUserId("");
      setStatus("");
      setComment("");
      setEstimated("");
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
      <PageMeta title="Verification — drivers" description="Verification drivers list" />
      <PageBreadcrumb pageTitle="Verification — drivers" />

      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={openModal}>
          Create
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[820px] m-4">
        <div className="no-scrollbar relative w-full max-w-[820px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Create verification
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Create a new verification record
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
              <div>
                <Label>User (driver user id) *</Label>
                <Input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>
              <div>
                <Label>Status *</Label>
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
            <div className="flex items-center gap-3 px-2 mt-6 justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button
                size="sm"
                disabled={creating || !userId.trim() || !status.trim()}
                onClick={() => void create()}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ComponentCard title={`Verification — drivers (${count})`} desc="Click a row to open details / update status.">
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
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Estimated (h)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Reviewed at
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Reviewer
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
                      onClick={() => navigate(`/site-settings/verification-drivers/${it.id}`)}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        <Badge size="sm" color={it.status === "approved" ? "success" : it.status === "rejected" ? "error" : "warning"}>
                          {it.status_display || it.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.estimated_review_hours ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(it.reviewed_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.reviewer ?? "-"}
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

