import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import OrderStatusBadge from "../../utils/orderStatusBadge";
import { getId, type ApiListEnvelope } from "./OrdersAdminCommon";
import PickDropAddressCell from "./PickDropAddressCell";
import { formatPickDateTime, parseOrderListRow } from "./orderListHelpers";

type AnyObj = Record<string, unknown>;

const FILTER_LABELS: Record<string, string> = {
  all: "All Rides",
  scheduled: "Scheduled Rides",
  pending: "Pending Rides",
  cancelled: "Cancelled Rides",
  running: "Running Rides",
  completed: "Completed Rides",
};

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v.trim() ? v : "-";
  return String(v);
}

const TABLE_HEADERS = [
  "Ride Id",
  "Ride Type",
  "Rider Name",
  "Driver Name",
  "Pick DateTime",
  "Pick / Drop Address",
  "Cancel By",
  "Cancel Reason",
  "Status",
  "Payment Type",
];

function buildApiQuery(filter: string, search: string, page: number, pageSize: number) {
  const qs = new URLSearchParams();
  if (filter && filter !== "all") qs.set("filter", filter);
  if (search.trim()) qs.set("search", search.trim());
  qs.set("page", String(page));
  qs.set("page_size", String(pageSize));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default function OrdersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = 50;

  const [items, setItems] = useState<AnyObj[]>([]);
  const [meta, setMeta] = useState<{
    total_count?: number;
    page?: number;
    page_size?: number;
    total_pages?: number;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const pageTitle = FILTER_LABELS[filter] || "All Rides";

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const query = buildApiQuery(filter, search, page, pageSize);
      const res = await getJson<ApiListEnvelope<AnyObj>>(`admin-panel/orders/${query}`, {
        headers: getAuthHeaders(),
      });
      setItems(res.data ?? []);
      setMeta({
        total_count: res.total_count ?? res.count ?? res.data?.length ?? 0,
        page: res.page ?? page,
        page_size: res.page_size ?? pageSize,
        total_pages: res.total_pages ?? 1,
      });
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    load();
  }, [filter, search, page]);

  const totalCount = meta.total_count ?? items.length;
  const totalPages = meta.total_pages ?? 1;
  const currentPage = meta.page ?? page;

  const rangeStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = totalCount
    ? Math.min(currentPage * pageSize, totalCount)
    : 0;

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "" || (k === "filter" && v === "all")) params.delete(k);
      else params.set(k, v);
    });
    if (!next.page) params.delete("page");
    setSearchParams(params);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput.trim() || null, page: null });
  }

  const countLabel = useMemo(
    () => `${totalCount} order${totalCount === 1 ? "" : "s"}`,
    [totalCount]
  );

  return (
    <>
      <PageMeta title={pageTitle} description="Orders list" />
      <PageBreadcrumb pageTitle={pageTitle} />

      <form className="mb-4 flex flex-wrap items-center gap-3" onSubmit={submitSearch}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search order code, email, name, ID..."
          className="h-11 min-w-[260px] flex-1 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <Button size="sm">Search</Button>
        {search ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              updateParams({ search: null, page: null });
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <ComponentCard title={`${pageTitle} (${countLabel})`} desc="Click a row to open details.">
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
                    {TABLE_HEADERS.map((h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => {
                    const row = parseOrderListRow(it as Record<string, unknown>);
                    const id = row.id ?? getId(it);
                    return (
                      <TableRow
                        key={(id ?? idx) as string | number}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        onClick={() => {
                          if (!id) return;
                          navigate(`/orders/orders/${id}`);
                        }}
                      >
                        <TableCell className="px-4 py-3 text-start">
                          <span className="font-medium text-brand-500 text-theme-sm hover:underline dark:text-brand-400">
                            {row.orderCode || String(id ?? "---")}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-200">
                          {row.rideTypeName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-200">
                          {row.riderName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-200">
                          {row.driverName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                          {formatPickDateTime(row.pickAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <PickDropAddressCell from={row.addressFrom} to={row.addressTo} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                          {row.cancelBy}
                        </TableCell>
                        <TableCell className="max-w-[200px] px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                          {row.cancelReason}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <OrderStatusBadge status={row.status} label={safeStr(row.status)} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                          {safeStr(row.paymentType)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!items.length && (
                    <TableRow>
                      <TableCell
                        className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400"
                        colSpan={TABLE_HEADERS.length}
                      >
                        No orders.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-white/[0.05]">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {rangeStart} to {rangeEnd} of {totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => updateParams({ page: String(currentPage - 1) })}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateParams({ page: String(currentPage + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}
