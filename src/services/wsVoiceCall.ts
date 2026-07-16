import type { IncomingCallPayload } from "./voiceCallTypes";
import { deriveWsBaseFromApi } from "./voiceCallApi";

export type VoiceCallWsEvent =
  | { type: "connection_established"; message?: string; user_id?: number }
  | { type: "incoming_call"; payload: IncomingCallPayload }
  | { type: "incoming_support_call"; payload: IncomingCallPayload }
  | { type: "call_accepted"; payload?: Record<string, unknown> }
  | { type: "call_rejected"; payload?: Record<string, unknown> }
  | { type: "call_cancelled"; payload?: Record<string, unknown> }
  | { type: "call_ended"; payload?: Record<string, unknown> };

type Listener = (event: VoiceCallWsEvent) => void;

let ws: WebSocket | null = null;
let listeners = new Set<Listener>();
let connectInFlight = false;
let lastUrl = "";

function getAuthToken() {
  return localStorage.getItem("auth_token") || "";
}

function buildWsUrl() {
  const env =
    (import.meta as any).env?.VITE_WS_BASE_URL?.toString?.() ??
    (import.meta as any).env?.VITE_WS_BASE_URL ??
    "";
  const base =
    (env && String(env).trim()) ||
    deriveWsBaseFromApi() ||
    ((import.meta as any).env?.DEV ? "ws://127.0.0.1:8001" : "wss://api.holadrive.app");

  const token = getAuthToken();
  const url = new URL("/ws/voice-call/", base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function emit(event: VoiceCallWsEvent) {
  for (const cb of listeners) cb(event);
}

function handleMessage(raw: unknown) {
  try {
    const parsed = JSON.parse(String(raw ?? "{}")) as VoiceCallWsEvent;
    if (!parsed?.type) return;
    emit(parsed);
  } catch {
    // ignore
  }
}

function ensureConnected() {
  if (connectInFlight) return;
  const url = buildWsUrl();
  if (ws && ws.readyState <= 1 && lastUrl === url) return;

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
    if (listeners.size) {
      setTimeout(() => ensureConnected(), 1000);
    }
  };
}

function ensureClosedIfUnused() {
  if (listeners.size) return;
  try {
    ws?.close();
  } catch {
    // ignore
  }
  ws = null;
}

export function subscribeVoiceCallWs(cb: Listener) {
  listeners.add(cb);
  ensureConnected();
  return () => {
    listeners.delete(cb);
    ensureClosedIfUnused();
  };
}

export function getVoiceCallWsState() {
  if (!ws) return "closed" as const;
  if (ws.readyState === WebSocket.CONNECTING) return "connecting" as const;
  if (ws.readyState === WebSocket.OPEN) return "open" as const;
  return "closed" as const;
}

export function disconnectVoiceCallWs() {
  listeners.clear();
  ensureClosedIfUnused();
}
