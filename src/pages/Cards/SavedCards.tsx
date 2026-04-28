import { useEffect, useMemo, useState } from "react";
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
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import { formatDate, type ApiListEnvelope } from "../Accounts/AdminPanelCommon";

type SavedCard = {
  id?: number;
  user?: {
    id?: number;
    email?: string | null;
    full_name?: string | null;
    phone_number?: string | null;
    [key: string]: unknown;
  } | null;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | string | null;
  exp_year?: number | string | null;
  holder_name?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v || "-";
  return String(v);
}

export default function SavedCards() {
  const [items, setItems] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<SavedCard>>(
        "admin-panel/payment/saved-cards/",
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

  return (
    <>
      <PageMeta title="Saved cards" description="Saved cards list" />
      <PageBreadcrumb pageTitle="Saved cards" />

      <ComponentCard title={`Saved cards (${count})`} desc="Cards saved in the system.">
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
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      #
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Holder
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Brand
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Last4
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Exp
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Default
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Updated
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => (
                    <TableRow key={(it.id ?? idx) as any}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-200">
                        {safeStr(it.user?.full_name || it.user?.email || it.holder_name)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {safeStr(it.brand)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.last4 ? `•••• ${it.last4}` : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.exp_month || it.exp_year
                          ? `${safeStr(it.exp_month)}/${safeStr(it.exp_year)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        <Badge size="sm" color={it.is_default ? "success" : "warning"}>
                          {it.is_default ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate((it.updated_at as string) || (it.created_at as string))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No saved cards.
                      </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
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

