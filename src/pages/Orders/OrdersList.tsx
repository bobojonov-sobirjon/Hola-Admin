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
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import Badge from "../../components/ui/badge/Badge";
import { formatDate, getId, type ApiListEnvelope } from "./OrdersAdminCommon";

type AnyObj = Record<string, unknown>;

function userLabel(v: unknown) {
  if (!v || typeof v !== "object") return "-";
  const u = v as any;
  const name = typeof u.full_name === "string" && u.full_name.trim() ? u.full_name.trim() : "";
  const email = typeof u.email === "string" && u.email.trim() ? u.email.trim() : "";
  if (email && name) return `${email} (${name})`;
  return email || name || "-";
}

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v.trim() ? v : "-";
  return String(v);
}

export default function OrdersList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<AnyObj>>("admin-panel/orders/", {
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

  useEffect(() => {
    load();
  }, []);

  const count = useMemo(() => items.length, [items]);

  return (
    <>
      <PageMeta title="Orders" description="Orders list" />
      <PageBreadcrumb pageTitle="Orders" />

      <ComponentCard title={`Orders (${count})`} desc="Click a row to open details.">
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
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Order Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      User
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Payment Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Stripe trip payment status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Created at
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Updated at
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => {
                    const anyIt = it as any;
                    const order =
                      anyIt?.order && typeof anyIt.order === "object" ? (anyIt.order as any) : null;
                    const id = order?.id ?? getId(it);
                    const status = order?.status_display || order?.status;
                    return (
                      <TableRow
                        key={(id ?? idx) as any}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        onClick={() => {
                          if (!id) return;
                          navigate(`/orders/orders/${id}`);
                        }}
                      >
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-200">
                          {safeStr(order?.order_code ?? order?.code ?? order?.id ?? anyIt.id)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {userLabel(anyIt.user)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge
                            size="sm"
                            color={
                              status === "completed" || status === "Completed"
                                ? "success"
                                : status === "cancelled" || status === "Cancelled"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {safeStr(status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {safeStr(order?.payment_type)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {safeStr(
                            order?.stripe_trip_payment_status ??
                              anyIt?.stripe_trip_payment?.stripe_trip_payment_status ??
                              anyIt?.stripe_payment_status
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(order?.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(order?.updated_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!items.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No orders.
                      </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
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

