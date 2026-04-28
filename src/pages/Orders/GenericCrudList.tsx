import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
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
import { getAuthHeaders, getErrorMessage, getJson, postJson } from "../../config/api";
import CrudJsonModal from "./CrudJsonModal";
import CrudFormModal, { type FieldDef } from "./CrudFormModal";
import { formatDate, getId, pickTitleLike, type ApiListEnvelope } from "./OrdersAdminCommon";

type AnyObj = Record<string, unknown>;
type Column = { header: string; render: (row: AnyObj) => React.ReactNode; className?: string };

function includesText(row: AnyObj, q: string) {
  if (!q) return true;
  const qq = q.toLowerCase();
  try {
    return JSON.stringify(row).toLowerCase().includes(qq);
  } catch {
    return false;
  }
}

export default function GenericCrudList({
  title,
  breadcrumb,
  apiPath,
  detailsRouteBase,
  enableCreate = true,
  addLabel,
  columns,
  createInitialJson,
  createFields,
}: {
  title: string;
  breadcrumb: string;
  apiPath: string; // relative to /api/v1/
  detailsRouteBase: string; // route base e.g. "/orders/ride-types"
  enableCreate?: boolean;
  addLabel?: string;
  columns?: Column[];
  createInitialJson?: unknown;
  createFields?: FieldDef[];
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState<"all" | "active" | "inactive">("all");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<AnyObj>>(apiPath, {
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

  async function create(body: AnyObj) {
    if (!enableCreate) return;
    setError(null);
    setCreating(true);
    try {
      await postJson<unknown>(apiPath, body, { headers: getAuthHeaders() });
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
  }, [apiPath]);

  const count = useMemo(() => items.length, [items]);
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (!includesText(it, q)) return false;
      if (activeOnly === "all") return true;
      const v = it.is_active;
      if (typeof v !== "boolean") return true;
      return activeOnly === "active" ? v : !v;
    });
  }, [items, q, activeOnly]);

  const tableColumns: Column[] = useMemo(() => {
    if (columns?.length) return columns;
    return [
      { header: "Name", render: (it) => pickTitleLike(it) },
      {
        header: "Active",
        render: (it) =>
          typeof it.is_active === "boolean" ? (
            <Badge size="sm" color={it.is_active ? "success" : "error"}>
              {it.is_active ? "Yes" : "No"}
            </Badge>
          ) : (
            "-"
          ),
      },
      { header: "Created at", render: (it) => formatDate((it.created_at as string) || null) },
    ];
  }, [columns]);

  return (
    <>
      <PageMeta title={title} description={breadcrumb} />
      <PageBreadcrumb pageTitle={breadcrumb} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="h-11 w-[260px] rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <select
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            value={activeOnly}
            onChange={(e) => setActiveOnly(e.target.value as any)}
          >
            <option value="all">is_active: all</option>
            <option value="active">is_active: true</option>
            <option value="inactive">is_active: false</option>
          </select>
        </div>
        <div className="ml-auto">
          {enableCreate && (
            <Button size="sm" onClick={openModal}>
              {addLabel ?? `Add ${title}`}
            </Button>
          )}
        </div>
      </div>

      {createFields?.length ? (
        <CrudFormModal
          isOpen={isOpen}
          onClose={closeModal}
          title={`Create ${title}`}
          initialValues={
            createInitialJson && typeof createInitialJson === "object" && !Array.isArray(createInitialJson)
              ? (createInitialJson as Record<string, unknown>)
              : undefined
          }
          fields={createFields}
          submitText="Create"
          busyText="Creating..."
          submitting={creating}
          onSubmit={create}
        />
      ) : (
        <CrudJsonModal
          isOpen={isOpen}
          onClose={closeModal}
          title={`Create ${title}`}
          initialJson={createInitialJson ?? {}}
          submitText="Create"
          busyText="Creating..."
          submitting={creating}
          onSubmit={create}
        />
      )}

      <ComponentCard title={`${breadcrumb} (${count})`} desc="">
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
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      #
                    </TableCell>
                    {tableColumns.map((c) => (
                      <TableCell
                        key={c.header}
                        isHeader
                        className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 ${c.className ?? ""}`}
                      >
                        {c.header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filtered.map((it, idx) => {
                    const id = getId(it);
                    return (
                      <TableRow
                        key={(id ?? idx) as any}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        onClick={() => {
                          if (!id) return;
                          navigate(`${detailsRouteBase}/${id}`);
                        }}
                      >
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {idx + 1}
                          </span>
                        </TableCell>
                        {tableColumns.map((c) => (
                          <TableCell
                            key={c.header}
                            className={`px-4 py-3 text-start text-theme-sm ${c.className ?? ""}`}
                          >
                            {c.render(it)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No items.
                      </TableCell>
                      {tableColumns.map((c) => (
                        <TableCell key={c.header} className="px-4 py-3">
                          {" "}
                        </TableCell>
                      ))}
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

