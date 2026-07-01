import { Link } from "react-router";
import OrderStatusBadge from "../../utils/orderStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

export type RecentRideRow = {
  ride_id?: string;
  order_id: number;
  order_code?: string;
  rider_name?: string;
  driver_name?: string;
  pickup_address?: string;
  dropoff_address?: string;
  created_at?: string;
  ride_fare?: number;
  currency?: string;
  status?: string;
  status_label?: string;
  action?: string;
};

function formatFare(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return `$ ${amount}`;
  }
}

function formatDate(iso?: string): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export default function RecentRides({ rows }: { rows: RecentRideRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Rides
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              {["Ride Id", "Rider Name", "Driver Name", "Pick / Drop Address", "Date", "Ride Fare", "Status"].map(
                (h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="whitespace-nowrap py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((r, idx) => {
              const dt = formatDate(r.created_at);
              const status = r.status || "";
              const actionLabel =
                r.action === "view_invoice" || status === "completed"
                  ? "View Invoice"
                  : "View Details";
              return (
                <TableRow key={`${r.order_id}-${idx}`}>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {r.ride_id || r.order_code || String(r.order_id)}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {r.rider_name || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {r.driver_name || "-"}
                  </TableCell>
                  <TableCell className="max-w-xs py-3 text-theme-sm">
                    <div className="flex items-start gap-1.5 text-gray-600 dark:text-gray-300">
                      <span className="mt-0.5 text-green-600">●</span>
                      <span className="line-clamp-2">{r.pickup_address || "-"}</span>
                    </div>
                    <div className="mt-1 flex items-start gap-1.5 text-gray-600 dark:text-gray-300">
                      <span className="mt-0.5 text-red-500">●</span>
                      <span className="line-clamp-2">{r.dropoff_address || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {dt ? (
                      <>
                        <div>{dt.date}</div>
                        <div className="text-theme-xs text-gray-500">{dt.time}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {formatFare(Number(r.ride_fare ?? 0), r.currency || "USD")}
                  </TableCell>
                  <TableCell className="py-3">
                    <OrderStatusBadge
                      status={status}
                      label={r.status_label || status}
                    />
                    <div className="mt-1">
                      <Link
                        to={`/orders/orders/${r.order_id}`}
                        className="text-theme-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        {actionLabel}
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell className="py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                  No recent rides.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
