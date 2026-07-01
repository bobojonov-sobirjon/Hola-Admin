import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import {
  buildPageQuery,
  ListPageSizeSelect,
  TablePaginationFooter,
} from "../../components/common/TablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import { type ApiListEnvelope } from "./AdminPanelCommon";

type Rider = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  id_identification: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
};

export default function RidersList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Rider[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(currentPage: number, limit: number) {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<Rider>>(
        `admin-panel/riders/${buildPageQuery(currentPage, limit)}`,
        { headers: getAuthHeaders() }
      );
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
  }, [page, pageSize]);

  const countLabel = useMemo(
    () => `${totalCount} rider${totalCount === 1 ? "" : "s"}`,
    [totalCount]
  );

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <>
      <PageMeta title="Riders" description="Riders list" />
      <PageBreadcrumb pageTitle="Riders" />

      <div className="mb-4">
        <ListPageSizeSelect pageSize={pageSize} onChange={changePageSize} />
      </div>

      <ComponentCard title={`Riders (${countLabel})`} desc="Click a row to open details.">
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
                      "#",
                      "Email",
                      "Username",
                      "First name",
                      "Last name",
                      "ID Identification",
                      "Email Verified",
                      "Active",
                      "Created At",
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
                  {items.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() => navigate(`/accounts/riders/${r.id}`)}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {(page - 1) * pageSize + idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {r.email}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {r.username}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {r.first_name || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {r.last_name || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {r.id_identification || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge size="sm" color={r.is_verified ? "success" : "warning"}>
                          {r.is_verified ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge size="sm" color={r.is_active ? "success" : "error"}>
                          {r.is_active ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell
                        className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400"
                        colSpan={9}
                      >
                        No riders found.
                      </TableCell>
                    </TableRow>
                  )}
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
