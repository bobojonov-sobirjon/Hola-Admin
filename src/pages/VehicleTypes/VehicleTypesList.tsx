import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useModal } from "../../hooks/useModal";
import { PencilIcon, TrashBinIcon } from "../../icons";
import {
  deleteJson,
  getAuthHeaders,
  getErrorMessage,
  getJson,
  patchJson,
  postJson,
} from "../../config/api";
import CrudFormModal, { type FieldDef } from "../Orders/CrudFormModal";
import { type ApiListEnvelope } from "../Accounts/AdminPanelCommon";
import {
  formatMoney,
  formatVehicleTypeName,
  getVehicleTypeIcon,
  type RideTypeLike,
} from "../../utils/vehicleTypeIcons";

type RideType = RideTypeLike & {
  base_price?: string | number;
  price_per_km?: string | number;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
};

const API_PATH = "admin-panel/ride-types/";

const FORM_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Hola" },
  { key: "name_large", label: "Name large", type: "text", placeholder: "Hola Large" },
  { key: "base_price", label: "Base price *", type: "text", placeholder: "7.00" },
  { key: "price_per_km", label: "Price per km *", type: "text", placeholder: "1.50" },
  { key: "capacity", label: "Capacity", type: "number", placeholder: "4" },
  { key: "is_premium", label: "Premium", type: "checkbox" },
  { key: "is_ev", label: "Electric (EV)", type: "checkbox" },
  { key: "is_active", label: "Active", type: "checkbox" },
];

const CREATE_INITIAL = {
  name: "Hola",
  name_large: "",
  base_price: "7.00",
  price_per_km: "1.50",
  capacity: 4,
  is_premium: false,
  is_ev: false,
  is_active: true,
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

function includesText(row: RideType, q: string) {
  if (!q) return true;
  const qq = q.toLowerCase();
  return [row.name, row.name_large, row.id]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(qq));
}

export default function VehicleTypesList() {
  const [items, setItems] = useState<RideType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState<"all" | "active" | "inactive">("all");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<RideType | null>(null);
  const [deletingItem, setDeletingItem] = useState<RideType | null>(null);

  const createModal = useModal(false);
  const editModal = useModal(false);
  const deleteModal = useModal(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const query =
        activeOnly === "active"
          ? "?is_active=true"
          : activeOnly === "inactive"
            ? "?is_active=false"
            : "";
      const res = await getJson<ApiListEnvelope<RideType>>(`${API_PATH}${query}`, {
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
  }, [activeOnly]);

  const filtered = useMemo(
    () => items.filter((it) => includesText(it, q)),
    [items, q]
  );

  async function create(body: Record<string, unknown>) {
    setError(null);
    setCreating(true);
    try {
      await postJson<unknown>(API_PATH, body, { headers: getAuthHeaders() });
      createModal.closeModal();
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(body: Record<string, unknown>) {
    if (!editing?.id) return;
    setError(null);
    setSaving(true);
    try {
      await patchJson<unknown>(`${API_PATH}${editing.id}/`, body, {
        headers: getAuthHeaders(),
      });
      editModal.closeModal();
      setEditing(null);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingItem?.id) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(`${API_PATH}${deletingItem.id}/`, {
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

  function openEdit(item: RideType) {
    setEditing(item);
    editModal.openModal();
  }

  function openDelete(item: RideType) {
    setDeletingItem(item);
    deleteModal.openModal();
  }

  const deleteLabel =
    deletingItem?.name?.trim() ||
    deletingItem?.name_large?.trim() ||
    (deletingItem?.id ? `ID ${deletingItem.id}` : undefined);

  return (
    <>
      <PageMeta title="Vehicle Type" description="Vehicle types" />
      <PageBreadcrumb pageTitle="Vehicle Type" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={createModal.openModal}>
          Add Vehicle Type
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="h-11 w-[240px] rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <select
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={activeOnly}
            onChange={(e) => setActiveOnly(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <CrudFormModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        title="Add Vehicle Type"
        initialValues={CREATE_INITIAL}
        fields={FORM_FIELDS}
        submitText="Create"
        busyText="Creating..."
        submitting={creating}
        onSubmit={create}
      />

      <CrudFormModal
        isOpen={editModal.isOpen}
        onClose={() => {
          editModal.closeModal();
          setEditing(null);
        }}
        title="Edit Vehicle Type"
        initialValues={editing ?? undefined}
        fields={FORM_FIELDS}
        submitText="Save"
        busyText="Saving..."
        submitting={saving}
        onSubmit={saveEdit}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.closeModal();
          setDeletingItem(null);
        }}
        onConfirm={() => void confirmDelete()}
        deleting={deleting}
        entityLabel="vehicle type"
        displayName={deleteLabel}
      />

      <ComponentCard title={`Vehicle types (${filtered.length})`} desc="">
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
                    {[
                      "Id",
                      "Type image",
                      "Type name",
                      "Base price",
                      "Cost per km",
                      "Capacity",
                      "Status",
                      "Action",
                    ].map((h) => (
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
                  {filtered.map((it) => {
                    const { primary, secondary } = formatVehicleTypeName(it);
                    return (
                      <TableRow key={it.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                          {it.id}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gray-50 dark:bg-white/[0.04]">
                            <img
                              src={getVehicleTypeIcon(it)}
                              alt={primary}
                              className="h-10 w-10 object-contain"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {primary}
                          </div>
                          {secondary ? (
                            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {secondary}
                            </div>
                          ) : null}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {it.is_premium ? (
                              <Badge size="sm" color="error">
                                Premium
                              </Badge>
                            ) : null}
                            {it.is_ev ? (
                              <Badge size="sm" color="success">
                                EV
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {formatMoney(it.base_price)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {formatMoney(it.price_per_km)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                          {it.capacity ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <Badge size="sm" color={it.is_active ? "success" : "warning"}>
                            {it.is_active ? "On" : "Off"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600"
                              onClick={() => openEdit(it)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-error-500 text-white transition hover:bg-error-600"
                              onClick={() => openDelete(it)}
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell
                        className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                        colSpan={8}
                      >
                        No vehicle types found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
              Showing {filtered.length ? 1 : 0} to {filtered.length} of {filtered.length} entries
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}
