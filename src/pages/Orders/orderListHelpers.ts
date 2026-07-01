type AnyObj = Record<string, unknown>;

function asObj(v: unknown): AnyObj | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as AnyObj;
}

function asArr(v: unknown): AnyObj[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as AnyObj[];
}

function personName(u: AnyObj | null) {
  if (!u) return "";
  const full = typeof u.full_name === "string" ? u.full_name.trim() : "";
  if (full) return full;
  const first = typeof u.first_name === "string" ? u.first_name.trim() : "";
  const last = typeof u.last_name === "string" ? u.last_name.trim() : "";
  return [first, last].filter(Boolean).join(" ");
}

function dash(v: string) {
  return v.trim() ? v : "---";
}

function pickStr(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function parseOrderListRow(it: AnyObj) {
  const order = asObj(it.order) ?? it;
  const user = asObj(it.user);
  const orderItems = asArr(it.order_items);
  const firstItem = orderItems[0] ?? null;

  const addressFrom = pickStr(
    it.address_from,
    order.address_from,
    firstItem?.address_from
  );
  const addressTo = pickStr(it.address_to, order.address_to, firstItem?.address_to);

  const orderDrivers = asArr(it.order_drivers);
  const acceptedDriver =
    orderDrivers.find((d) => d.status === "accepted" || d.status === "completed") ??
    orderDrivers[0];
  const driverObj = asObj(acceptedDriver?.driver_obj) ?? asObj(acceptedDriver?.driver);

  const cancelOrders = asArr(it.cancel_orders);
  const cancel = cancelOrders[0] ?? null;

  const rideTypes = asArr(it.ride_types);
  const rideTypeName =
    pickStr(
      it.ride_type,
      it.ride_type_name,
      rideTypes[0]?.name,
      rideTypes[0]?.name_large
    ) || "Ride";

  const schedules = asArr(it.order_schedules);
  const pickAt =
    pickStr(
      schedules[0]?.scheduled_at,
      schedules[0]?.pickup_at,
      order.pickup_at,
      order.scheduled_at,
      order.created_at
    ) || "";

  const cancelBy = pickStr(
    cancel?.cancel_by,
    cancel?.cancelled_by,
    cancel?.canceled_by,
    cancel?.cancelled_by_display,
    cancel?.user_type,
    cancel?.role
  );

  const cancelReason = pickStr(
    cancel?.reason,
    cancel?.cancel_reason,
    cancel?.comment,
    cancel?.title
  );

  const orderId = order.id ?? it.id;
  const orderCode = pickStr(order.order_code, order.code, it.order_code, it.ride_id);

  return {
    id: orderId,
    orderCode,
    rideTypeName,
    riderName: dash(personName(user) || pickStr(it.rider_name)),
    driverName: dash(
      personName(driverObj) || pickStr(it.driver_name, acceptedDriver?.driver_name)
    ),
    pickAt,
    addressFrom: dash(addressFrom),
    addressTo: dash(addressTo),
    cancelBy: dash(cancelBy),
    cancelReason: dash(cancelReason),
    status: pickStr(order.status_display, order.status, it.status),
    paymentType: pickStr(order.payment_type, it.payment_type),
  };
}

export function formatPickDateTime(iso?: string) {
  if (!iso) return "---";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const date = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}
