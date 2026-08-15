import { BASE_URL, getAuthHeaders, getJson, postJson } from "../config/api";

export type WsCashoutCreated = {
  cashoutId: number;
  driverId?: number;
  amount?: string;
  paymentType?: string;
  status?: string;
  createdAt: string;
};

export type AppNotification = {
  id: number;
  title?: string;
  message?: string;
  notificationType?: string;
  relatedObjectType?: string;
  relatedObjectId?: number;
  data?: Record<string, unknown>;
  createdAt?: string;
  status?: string; // unread|read
};

type WsNotificationEnvelope = {
  type?: string;
  event?: string;
  notification?: {
    id?: number;
    title?: string;
    message?: string;
    notification_type?: string;
    related_object_type?: string;
    related_object_id?: number;
    data?: Record<string, unknown>;
    created_at?: string;
    status?: string;
  };
  data?: Record<string, unknown>;
  [k: string]: unknown;
};

type CashoutListener = (n: WsCashoutCreated) => void;
type NotificationListener = (n: AppNotification) => void;

let ws: WebSocket | null = null;
let cashoutListeners = new Set<CashoutListener>();
let notificationListeners = new Set<NotificationListener>();
let connectInFlight = false;
let lastUrl = "";

function getAuthToken() {
  return localStorage.getItem("auth_token") || "";
}

function deriveWsBaseFromApi(): string | null {
  const b = String(BASE_URL || "").trim();
  if (!b) return null;
  if (!/^https?:\/\//i.test(b)) return null;
  try {
    const u = new URL(b);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}`;
  } catch {
    return null;
  }
}

function buildWsUrl(): string {
  const env =
    (import.meta as any).env?.VITE_WS_BASE_URL?.toString?.() ??
    (import.meta as any).env?.VITE_WS_BASE_URL ??
    "";
  const base =
    (env && String(env).trim()) ||
    deriveWsBaseFromApi() ||
    ((import.meta as any).env?.DEV ? "ws://127.0.0.1:8001" : "wss://api.holadrive.app");

  const token = getAuthToken();
  const url = new URL("/ws/notifications/", base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function emit(n: WsCashoutCreated) {
  for (const cb of cashoutListeners) cb(n);
}

function emitNotification(n: AppNotification) {
  for (const cb of notificationListeners) cb(n);
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeNotification(
  n: NonNullable<WsNotificationEnvelope["notification"]>,
  fallbackData?: Record<string, unknown>
): AppNotification | null {
  const id = asNumber(n.id);
  if (id == null) return null;
  const data = {
    ...((fallbackData ?? {}) as Record<string, unknown>),
    ...((n.data ?? {}) as Record<string, unknown>),
  };
  const nt =
    String(n.notification_type || "") ||
    String(data.event || data.notification_type || "");

  return {
    id,
    title: n.title,
    message: n.message,
    notificationType: nt,
    relatedObjectType: n.related_object_type,
    relatedObjectId: asNumber(n.related_object_id),
    data,
    createdAt: n.created_at,
    status: n.status || "unread",
  };
}

/** Frontend route for a notification (driver verification, chat, etc.). */
export function resolveNotificationPath(n: AppNotification): string {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const event = String(data.event || n.notificationType || "").toLowerCase();

  const driverId =
    asNumber(data.driver_id) ??
    asNumber(data.driverId) ??
    (String(n.relatedObjectType || "").includes("driver")
      ? asNumber(n.relatedObjectId)
      : undefined);

  if (
    event === "driver_identification_in_review" ||
    n.notificationType === "driver_identification_in_review"
  ) {
    if (driverId != null) return `/accounts/drivers/${driverId}#verification`;
  }

  const adminPath = String(data.admin_path || data.adminPath || "");
  if (adminPath) {
    const m = adminPath.match(/\/drivers\/(\d+)/);
    if (m?.[1]) return `/accounts/drivers/${m[1]}#verification`;
  }

  if (driverId != null && (event.includes("driver") || event.includes("verification"))) {
    return `/accounts/drivers/${driverId}#verification`;
  }

  const supportRoomId =
    asNumber(data.support_room_id) ?? asNumber(data.supportRoomId);
  const relatedType = String(n.relatedObjectType ?? "");
  const relatedId = asNumber(n.relatedObjectId);
  const roomId =
    supportRoomId ??
    (relatedType === "support_room" ? relatedId : undefined);

  if (roomId != null) return `/chat/support/rooms/${roomId}`;
  return "/";
}

export function isDriverIdentificationInReview(n: AppNotification) {
  const data = (n.data ?? {}) as Record<string, unknown>;
  return (
    String(n.notificationType || "").toLowerCase() ===
      "driver_identification_in_review" ||
    String(data.event || "").toLowerCase() === "driver_identification_in_review"
  );
}

function handleMessage(raw: unknown) {
  try {
    const parsed = JSON.parse(String(raw ?? "{}")) as WsNotificationEnvelope;
    const n = parsed?.notification;
    const envelopeData = (parsed?.data ?? {}) as Record<string, unknown>;
    const envelopeEvent = String(
      parsed?.event || envelopeData.event || ""
    ).toLowerCase();

    // Some payloads may only include data.event without nested notification object shape.
    if (!n) {
      if (envelopeEvent === "driver_identification_in_review") {
        const syntheticId =
          asNumber(envelopeData.notification_id) ??
          asNumber(envelopeData.id) ??
          Date.now();
        emitNotification({
          id: syntheticId,
          title: String(envelopeData.title || "Driver identification submitted"),
          message: String(
            envelopeData.message || "A driver submitted identification for review"
          ),
          notificationType: "driver_identification_in_review",
          relatedObjectType: "driver",
          relatedObjectId: asNumber(envelopeData.driver_id),
          data: {
            ...envelopeData,
            event: "driver_identification_in_review",
          },
          createdAt: String(envelopeData.created_at || new Date().toISOString()),
          status: "unread",
        });
      }
      return;
    }

    const nt = String(n.notification_type || "").toLowerCase();
    const dataEvent = String((n.data as any)?.event || envelopeEvent || "").toLowerCase();
    const isGeneric =
      parsed.type === "notification" ||
      nt === "chat_message" ||
      nt === "driver_identification_in_review" ||
      dataEvent === "driver_identification_in_review" ||
      Boolean(n.id);

    if (isGeneric && nt !== "cashout_created") {
      const normalized = normalizeNotification(n, envelopeData);
      if (normalized) {
        if (
          !normalized.notificationType &&
          dataEvent === "driver_identification_in_review"
        ) {
          normalized.notificationType = "driver_identification_in_review";
        }
        emitNotification(normalized);
      }
      // cashout may also arrive as notification_type cashout_created below
      if (nt !== "cashout_created") return;
    }

    if (nt !== "cashout_created") return;

    const data = (n.data ?? {}) as Record<string, unknown>;
    const cashoutIdRaw = data.cashout_id ?? data.cashoutId ?? data.id;
    const cashoutId = Number(cashoutIdRaw);
    if (!Number.isFinite(cashoutId)) return;

    const createdAt =
      typeof data.created_at === "string"
        ? data.created_at
        : typeof n.created_at === "string"
          ? n.created_at
          : new Date().toISOString();

    emit({
      cashoutId,
      createdAt,
      driverId:
        typeof data.driver_id === "number"
          ? data.driver_id
          : Number(data.driver_id as any) || undefined,
      amount:
        typeof data.amount === "string"
          ? data.amount
          : data.amount != null
            ? String(data.amount)
            : undefined,
      paymentType:
        typeof data.payment_type === "string"
          ? data.payment_type
          : data.payment_type != null
            ? String(data.payment_type)
            : undefined,
      status:
        typeof data.status === "string"
          ? data.status
          : data.status != null
            ? String(data.status)
            : undefined,
    });
  } catch {
    // ignore
  }
}

function ensureConnected() {
  if (connectInFlight) return;
  const url = buildWsUrl();
  if (ws && ws.readyState <= 1 && lastUrl === url) return; // CONNECTING or OPEN

  connectInFlight = true;
  lastUrl = url;

  try {
    ws?.close();
  } catch {
    // ignore
  }

  try {
    ws = new WebSocket(url);
  } catch {
    connectInFlight = false;
    ws = null;
    return;
  }

  ws.onopen = () => {
    connectInFlight = false;
  };
  ws.onmessage = (evt) => handleMessage(evt.data);
  ws.onerror = () => {
    // wait for close
  };
  ws.onclose = () => {
    connectInFlight = false;
    ws = null;
    // auto-reconnect only if still needed
    if (cashoutListeners.size || notificationListeners.size) {
      setTimeout(() => ensureConnected(), 800);
    }
  };
}

function ensureClosedIfUnused() {
  if (cashoutListeners.size || notificationListeners.size) return;
  try {
    ws?.close();
  } catch {
    // ignore
  }
  ws = null;
}

export function subscribeCashoutCreated(cb: CashoutListener) {
  cashoutListeners.add(cb);
  ensureConnected();
  return () => {
    cashoutListeners.delete(cb);
    ensureClosedIfUnused();
  };
}

export function subscribeNotifications(cb: NotificationListener) {
  notificationListeners.add(cb);
  ensureConnected();
  return () => {
    notificationListeners.delete(cb);
    ensureClosedIfUnused();
  };
}

type NotificationsListEnvelope = {
  data?: AppNotification[] | Record<string, unknown>[];
  results?: AppNotification[] | Record<string, unknown>[];
  [k: string]: unknown;
};

function mapApiNotification(raw: any): AppNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asNumber(raw.id);
  if (id == null) return null;
  const data = (raw.data ?? {}) as Record<string, unknown>;
  return {
    id,
    title: raw.title,
    message: raw.message,
    notificationType: String(
      raw.notification_type || raw.notificationType || data.event || ""
    ),
    relatedObjectType: raw.related_object_type || raw.relatedObjectType,
    relatedObjectId: asNumber(raw.related_object_id ?? raw.relatedObjectId),
    data,
    createdAt: raw.created_at || raw.createdAt,
    status: raw.status,
  };
}

export async function fetchNotifications(params?: {
  status?: "unread" | "read";
  type?: string;
  page?: number;
  page_size?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.type) qs.set("type", params.type);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  const q = qs.toString();

  // Prefer /notifications/ (docs), fall back to /notification/
  const paths = [`notifications/${q ? `?${q}` : ""}`, `notification/${q ? `?${q}` : ""}`];
  let lastErr: unknown = null;
  for (const path of paths) {
    try {
      const res = await getJson<NotificationsListEnvelope>(path, {
        headers: getAuthHeaders(),
      });
      const arr = Array.isArray(res?.data)
        ? res.data
        : Array.isArray((res as any)?.results)
          ? ((res as any).results as any[])
          : Array.isArray(res as any)
            ? (res as any)
            : [];
      return arr.map(mapApiNotification).filter(Boolean) as AppNotification[];
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to fetch notifications");
}

export async function markNotificationRead(id: number) {
  try {
    return await postJson<unknown>(`notifications/${id}/read/`, {}, {
      headers: getAuthHeaders(),
    });
  } catch {
    return postJson<unknown>(`notification/${id}/read/`, {}, {
      headers: getAuthHeaders(),
    });
  }
}
