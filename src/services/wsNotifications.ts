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
    ((import.meta as any).env?.DEV ? "ws://127.0.0.1:8001" : "wss://apiss.firepole.ru");

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

function handleMessage(raw: unknown) {
  try {
    const parsed = JSON.parse(String(raw ?? "{}")) as WsNotificationEnvelope;
    const n = parsed?.notification;
    if (!n) return;
    const nt = String(n.notification_type || "");

    // Generic notifications (e.g. chat_message)
    if (parsed.type === "notification" || nt === "chat_message") {
      const id = Number(n.id);
      if (!Number.isFinite(id)) return;
      emitNotification({
        id,
        title: n.title,
        message: n.message,
        notificationType: nt,
        relatedObjectType: n.related_object_type,
        relatedObjectId:
          typeof n.related_object_id === "number"
            ? n.related_object_id
            : Number(n.related_object_id as any) || undefined,
        data: (n.data ?? {}) as any,
        createdAt: n.created_at,
        status: n.status,
      });
      return;
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
  data?: AppNotification[];
  results?: AppNotification[];
  [k: string]: unknown;
};

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
  const path = `notification/${q ? `?${q}` : ""}`;
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
  return arr;
}

export async function markNotificationRead(id: number) {
  return postJson<unknown>(`notification/${id}/read/`, {}, { headers: getAuthHeaders() });
}

