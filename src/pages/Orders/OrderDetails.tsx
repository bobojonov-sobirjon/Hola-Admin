import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import {
  flattenPrimitiveFields,
  formatDate,
  isDateLikeKey,
  prettyFieldName,
  type ApiDetailEnvelope,
} from "./OrdersAdminCommon";
import OrderRouteMap from "../../components/orders/OrderRouteMap";

type AnyObj = Record<string, unknown>;

function asObj(v: unknown): AnyObj | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as AnyObj;
}

function asArr(v: unknown): AnyObj[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as AnyObj[];
}

function userLabel(u: AnyObj | null) {
  if (!u) return "-";
  const email = typeof u.email === "string" ? u.email : "";
  const name = typeof u.full_name === "string" ? u.full_name : "";
  if (email && name) return `${email} (${name})`;
  return email || name || "-";
}

function driverLabel(d: AnyObj | null) {
  if (!d) return "-";
  const name = typeof d.full_name === "string" ? d.full_name : "";
  const phone = typeof d.phone_number === "string" ? d.phone_number : "";
  const main = name || "-";
  const secondary = phone ? phone : "";
  return secondary ? `${main} (${secondary})` : main;
}

function safe(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v.trim() ? v : "-";
  return String(v);
}

function safeBlank(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim() ? v : "";
  return String(v);
}

function humanizeValue(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s) return "";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function OrderDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiDetailEnvelope<AnyObj>>(`admin-panel/orders/${id}/`, {
        headers: getAuthHeaders(),
      });
      setItem(res.data ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const order = useMemo(() => asObj(item?.order), [item]);
  const user = useMemo(() => asObj(item?.user), [item]);
  const savedCard = useMemo(() => asObj(item?.saved_card), [item]);
  const rideTypes = useMemo(() => asArr(item?.ride_types), [item]);
  const orderItems = useMemo(() => asArr(item?.order_items), [item]);
  const orderDrivers = useMemo(() => asArr(item?.order_drivers), [item]);
  const orderPreferences = useMemo(() => asArr(item?.order_preferences), [item]);
  const additionalPassengers = useMemo(() => asArr(item?.additional_passengers), [item]);
  const orderSchedules = useMemo(() => asArr(item?.order_schedules), [item]);
  const cancelOrders = useMemo(() => asArr(item?.cancel_orders), [item]);
  const appliedPromoCodes = useMemo(() => asArr(item?.applied_promo_codes), [item]);
  const tripRating = useMemo(() => asObj(item?.trip_rating), [item]);

  const orderFields = useMemo(() => {
    if (!order) return [];
    const blocked = new Set<string>([
      "id",
      "user",
      "saved_card",
      "stripe_trip_payment_intent_id",
      "stripe_trip_payment_status",
      "stripe_trip_payment_amount_cents",
      "stripe_trip_payment_currency",
      "stripe_trip_payment_error",
    ]);
    return flattenPrimitiveFields(order).filter((f) => !blocked.has(f.key));
  }, [order]);
  const userFields = useMemo(
    () => (user ? flattenPrimitiveFields(user).filter((f) => f.key !== "id") : []),
    [user]
  );
  const tripRatingFields = useMemo(() => (tripRating ? flattenPrimitiveFields(tripRating) : []), [tripRating]);
  const savedCardSummary = useMemo(() => {
    if (!savedCard) return null;
    const last4 = safe(savedCard.last4);
    const brand = safe(savedCard.brand);
    const funding = safe(savedCard.funding);
    const expMonth = safe(savedCard.exp_month);
    const expYear = safe(savedCard.exp_year);
    const createdAt = formatDate((savedCard.created_at as any) ?? null);
    const updatedAt = formatDate((savedCard.updated_at as any) ?? null);
    return [
      { k: "Last4", v: last4 ? `•••• ${last4}` : "-" },
      { k: "Brand", v: brand },
      { k: "Funding", v: funding },
      { k: "Exp Month", v: expMonth },
      { k: "Exp Year", v: expYear },
      { k: "Created At", v: createdAt },
      { k: "Updated At", v: updatedAt },
    ];
  }, [savedCard]);

  const headerTitle = useMemo(() => {
    const code = order?.order_code;
    if (typeof code === "string" && code.trim()) return code;
    return `Order #${id ?? ""}`.trim();
  }, [order, id]);

  return (
    <>
      <PageMeta title="Order details" description="Order details" />
      <PageBreadcrumb pageTitle="Order details" />

      <div className="mb-4">
        <Link
          to="/orders/orders"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to orders
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : item ? (
        <div className="space-y-6">
          <ComponentCard title={headerTitle} desc="Order details">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Status:</span>
              <Badge
                size="sm"
                color={
                  order?.status === "completed"
                    ? "success"
                    : order?.status === "cancelled"
                      ? "error"
                      : "warning"
                }
              >
                {safe(order?.status)}
              </Badge>
              <span className="ml-2">Payment:</span>
              <Badge size="sm" color="info">
                {safe(order?.payment_type)}
              </Badge>
              <span className="ml-2">Paid:</span>
              <Badge
                size="sm"
                color={
                  order?.stripe_trip_payment_status === "succeeded"
                    ? "success"
                    : order?.stripe_trip_payment_status
                      ? "warning"
                      : "error"
                }
              >
                {safe(order?.stripe_trip_payment_status)}
              </Badge>
              <span className="ml-auto">Updated: {formatDate((order?.updated_at as any) ?? null)}</span>
            </div>
          </ComponentCard>

          <OrderRouteMap orderItems={orderItems} />

          {!!orderFields.length && (
            <ComponentCard title="Order" desc="">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {orderFields.map((f) => (
                  <div
                    key={f.key}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {prettyFieldName(f.key)}
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {isDateLikeKey(f.key) ? formatDate(f.value) : f.value}
                    </div>
                  </div>
                ))}
              </div>
            </ComponentCard>
          )}

          {!!userFields.length && (
            <ComponentCard title="User" desc={userLabel(user)}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {userFields.map((f) => {
                  const isGroups = f.key === "groups" && Array.isArray((user as any)?.groups);
                  const groups = isGroups ? ((user as any).groups as any[]) : [];
                  const groupNames =
                    isGroups && groups.length
                      ? groups.map((g) => (g?.name ? String(g.name) : "-")).filter(Boolean).join(", ")
                      : null;
                  return (
                  <div
                    key={f.key}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {prettyFieldName(f.key)}
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {isGroups ? groupNames || "-" : isDateLikeKey(f.key) ? formatDate(f.value) : f.value}
                    </div>
                  </div>
                  );
                })}
              </div>
            </ComponentCard>
          )}

          {!!savedCardSummary?.length && (
            <ComponentCard title="Saved card" desc="">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {savedCardSummary.map((f) => (
                  <div
                    key={f.k}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">{f.k}</div>
                    <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {f.v}
                    </div>
                  </div>
                ))}
              </div>
            </ComponentCard>
          )}

          <ComponentCard title="Ride types" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Base price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price / KM</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Capacity</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Active</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {rideTypes.map((rt, idx) => (
                      <TableRow key={(rt.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{safe(rt.name)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safe(rt.base_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safe(rt.price_per_km)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safe(rt.capacity)}</TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge size="sm" color={rt.is_active ? "success" : "error"}>
                            {rt.is_active ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rideTypes.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No ride types.</TableCell>
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
          </ComponentCard>

          <ComponentCard title="Order items" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">From</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">To</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Final stop</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Distance (km)</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Estimated time</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Calculated price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Original price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Adjusted price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Min price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Max price</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Adjustment %</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price adjusted</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {orderItems.map((oi, idx) => (
                      <TableRow key={(oi.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{safe(oi.address_from)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safe(oi.address_to)}</TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge size="sm" color={oi.is_final_stop ? "success" : "warning"}>
                            {oi.is_final_stop ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.distance_km)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.estimated_time)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.calculated_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.original_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.adjusted_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.min_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.max_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(oi.price_adjustment_percentage)}</TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge size="sm" color={oi.is_price_adjusted ? "warning" : "success"}>
                            {oi.is_price_adjusted ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((oi.created_at as any) ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!orderItems.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No order items.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
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
          </ComponentCard>

          <ComponentCard title="Order drivers" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Driver</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pickup confirmed</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Completed</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {orderDrivers.map((od, idx) => (
                      <TableRow key={(od.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          {driverLabel(asObj(od.driver_obj))}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge size="sm" color={od.status === "accepted" ? "success" : od.status === "timeout" ? "error" : "warning"}>
                            {safe(od.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((od.pickup_confirmed_at as any) ?? null)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((od.completed_at as any) ?? null)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((od.created_at as any) ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!orderDrivers.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No order drivers.</TableCell>
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
          </ComponentCard>

          <ComponentCard title="Order preferences" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Chatting</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Temperature</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Music</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Volume</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pet</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kids chair</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Wheelchair</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Gender</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Favorite driver</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {orderPreferences.map((op, idx) => (
                      <TableRow key={(op.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{safeBlank(op.chatting_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.temperature_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.music_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.volume_level)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.pet_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.kids_chair_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.wheelchair_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.gender_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(op.favorite_driver_preference)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((op.created_at as any) ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!orderPreferences.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No preferences.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
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
          </ComponentCard>

          <ComponentCard title="Additional passengers" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Full name</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {additionalPassengers.map((p, idx) => (
                      <TableRow key={(p.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{safeBlank(p.full_name)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(p.phone_number)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(p.email)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((p.created_at as any) ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!additionalPassengers.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No passengers.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Order schedules" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Scheduled</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {orderSchedules.map((s, idx) => (
                      <TableRow key={(s.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{formatDate((s.scheduled_at as any) ?? (s.date as any) ?? null)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{safeBlank(s.status)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{formatDate((s.created_at as any) ?? null)}</TableCell>
                      </TableRow>
                    ))}
                    {!orderSchedules.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No schedules.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Cancel orders" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Reason</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {cancelOrders.map((c, idx) => (
                      <TableRow key={(c.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          {humanizeValue((c.reason as any) ?? c.title ?? c.comment)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{formatDate((c.created_at as any) ?? null)}</TableCell>
                      </TableRow>
                    ))}
                    {!cancelOrders.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No cancels.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Applied promo codes" desc="">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Code</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Discount</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {appliedPromoCodes.map((p, idx) => (
                      <TableRow key={(p.id ?? idx) as any}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">{safeBlank((p.code as any) ?? p.promo_code ?? p.title)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {safeBlank((p.discount as any) ?? p.discount_percent ?? p.discount_amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate((p.created_at as any) ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!appliedPromoCodes.length && (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No promo codes.</TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                        <TableCell className="px-4 py-3"> </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ComponentCard>

          {!!tripRatingFields.length && (
            <ComponentCard title="Trip rating" desc="">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {tripRatingFields
                  .filter((f) =>
                    ["comment", "rating", "status", "created_at"].includes(f.key)
                  )
                  .map((f) => (
                    <div
                      key={f.key}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400">{prettyFieldName(f.key)}</div>
                      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                        {isDateLikeKey(f.key) ? formatDate(f.value) : f.value}
                      </div>
                    </div>
                  ))}
              </div>
            </ComponentCard>
          )}
        </div>
      ) : null}
    </>
  );
}

