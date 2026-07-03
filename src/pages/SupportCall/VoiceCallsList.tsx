import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import {
  ListPageSizeSelect,
  TablePaginationFooter,
} from "../../components/common/TablePagination";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getErrorMessage } from "../../config/api";
import { fetchVoiceCalls } from "../../services/voiceCallApi";
import {
  formatCallStatus,
  formatCallType,
  type VoiceCallRecord,
} from "../../services/voiceCallTypes";

function statusColor(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "answered" || s === "ended") return "success" as const;
  if (s === "ringing") return "warning" as const;
  if (s === "rejected" || s === "missed" || s === "cancelled") return "error" as const;
  return "light" as const;
}

export default function VoiceCallsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VoiceCallRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [callType, setCallType] = useState<"" | "rider_support" | "driver_support">("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(currentPage: number, limit: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVoiceCalls({
        page: currentPage,
        page_size: limit,
        call_type: callType || undefined,
        status: status || undefined,
      });
      setItems(res.data ?? []);
      const total = res.total_count ?? res.count ?? res.data?.length ?? 0;
      setTotalCount(total);
      setTotalPages(res.total_pages ?? Math.max(1, Math.ceil(total / limit)));
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, callType, status]);

  const countLabel = useMemo(
    () => `${totalCount} call${totalCount === 1 ? "" : "s"}`,
    [totalCount]
  );

  return (
    <>
      <PageMeta title="Call history" description="Support call history" />
      <PageBreadcrumb pageTitle="Call history" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={callType}
          onChange={(e) => {
            setCallType(e.target.value as "" | "rider_support" | "driver_support");
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="rider_support">Rider support</option>
          <option value="driver_support">Driver support</option>
        </select>
        <select
          className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ringing">Ringing</option>
          <option value="answered">Answered</option>
          <option value="ended">Ended</option>
          <option value="missed">Missed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="mb-4">
        <ListPageSizeSelect
          pageSize={pageSize}
          onChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <ComponentCard title={`Call history (${countLabel})`} desc="Click a row for details.">
        {error ? (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {["#", "Caller", "Type", "Status", "Order", "Duration", "Created"].map(
                      (h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() => navigate(`/support-call/history/${item.id}`)}
                    >
                      <TableCell className="px-5 py-4 text-start text-theme-sm">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {item.caller?.full_name || item.caller?.email || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {formatCallType(item.call_type)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge size="sm" color={statusColor(item.status)}>
                          {formatCallStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {item.order_code || item.order_id || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {item.duration_seconds != null ? `${item.duration_seconds}s` : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length ? (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No calls found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <TablePaginationFooter
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </ComponentCard>
    </>
  );
}
