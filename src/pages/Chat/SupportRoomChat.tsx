import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { BASE_URL, getAuthHeaders, getErrorMessage, getJson } from "../../config/api";

type SupportRoom = {
  id: number;
  user?: Record<string, unknown> | null;
  admin?: Record<string, unknown> | null;
  order_ids?: number[] | null;
  messages?: unknown[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: unknown;
};

type DetailEnvelope<T> = {
  data?: T;
  status?: string;
  message?: string;
  [k: string]: unknown;
};

type WsMessage = {
  sender_type: "admin" | "user" | "initiator" | "receiver" | "system" | string;
  message_type: "admin" | "user" | "system" | string;
  message: string;
  order_id?: number | null;
  created_at?: string;
  message_id?: string | number;
  sender_name?: string | null;
  [k: string]: unknown;
};

function normalizeMessage(raw: any): WsMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const senderType = String(raw.sender_type ?? "");
  const messageType = String(raw.message_type ?? "");
  const message = typeof raw.message === "string" ? raw.message : String(raw.message ?? "");
  const createdAt = raw.created_at ? String(raw.created_at) : undefined;
  const messageId = raw.message_id ?? raw.id ?? undefined;
  const senderName =
    typeof raw.sender_name === "string"
      ? raw.sender_name
      : raw.sender && typeof raw.sender === "object" && typeof raw.sender.full_name === "string"
      ? raw.sender.full_name
      : null;

  const orderIdRaw = raw.order_id ?? raw.order ?? null;
  const orderIdNum = orderIdRaw === null || orderIdRaw === undefined ? null : Number(orderIdRaw);

  return {
    sender_type: senderType,
    message_type: messageType,
    message,
    created_at: createdAt,
    message_id: messageId,
    sender_name: senderName,
    order_id: Number.isFinite(orderIdNum as number) ? (orderIdNum as number) : null,
  };
}

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function userLabel(user: Record<string, unknown> | null | undefined) {
  if (!user) return "-";
  const fullName = safeStr(user.full_name).trim();
  const email = safeStr(user.email).trim();
  const phone = safeStr(user.phone_number).trim();
  const main = fullName || email || phone || "-";
  const sub = email && email !== main ? email : phone && phone !== main ? phone : "";
  return sub ? `${main} — ${sub}` : main;
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

function buildSupportWsUrl(roomId: string) {
  const env =
    (import.meta as any).env?.VITE_WS_BASE_URL?.toString?.() ??
    (import.meta as any).env?.VITE_WS_BASE_URL ??
    "";
  const base =
    (env && String(env).trim()) ||
    deriveWsBaseFromApi() ||
    ((import.meta as any).env?.DEV ? "ws://127.0.0.1:8001" : "wss://api.holadrive.app");

  const token = localStorage.getItem("auth_token") || "";
  const url = new URL(`/ws/support/${roomId}/`, base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

export default function SupportRoomChat() {
  const { id } = useParams();
  const [room, setRoom] = useState<SupportRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">(
    "connecting"
  );
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [text, setText] = useState("");

  async function loadRoom() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<DetailEnvelope<SupportRoom>>(
        `chat/support/rooms/${id}/`,
        {
        headers: getAuthHeaders(),
        }
      );
      const r = res?.data ?? null;
      setRoom(r);
      const rawMsgs = Array.isArray((r as any)?.messages) ? ((r as any).messages as any[]) : [];
      const normalized = rawMsgs.map(normalizeMessage).filter(Boolean) as WsMessage[];
      setMessages(normalized);
    } catch (e) {
      setError(getErrorMessage(e));
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setWsStatus("connecting");
    setError(null);

    const url = buildSupportWsUrl(id);
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
    } catch (e) {
      setError(getErrorMessage(e));
      setWsStatus("closed");
      return;
    }

    ws.onopen = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => {
      // wait for close
    };
    ws.onmessage = (evt) => {
      try {
        const raw = JSON.parse(String(evt.data ?? "{}"));
        const msg = normalizeMessage(raw);
        if (!msg) return;
        setMessages((prev) => [...prev, msg]);
      } catch {
        // ignore
      }
    };

    return () => {
      try {
        ws?.close();
      } catch {
        // ignore
      }
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function send() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const msgText = text.trim();
    if (!msgText) return;
    const body: any = { type: "chat_message", message: msgText };
    ws.send(JSON.stringify(body));
    setText("");
  }

  return (
    <>
      <PageMeta title="Support room" description="Support room" />
      <PageBreadcrumb pageTitle="Support room" />

      <div className="mb-4">
        <Link
          to="/chat/support/rooms"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to rooms
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <>
          <ComponentCard title={`Room #${id}`} desc="">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="text-gray-500 dark:text-gray-400">User:</span>{" "}
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {userLabel(room?.user as any)}
                </span>
              </div>
              <div className="w-full text-xs text-gray-500 dark:text-gray-400">
                Status: {wsStatus}
              </div>
            </div>
          </ComponentCard>

          <div className="mt-6 grid grid-cols-1 gap-6">
            <div>
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div
                  ref={listRef}
                  className="h-[520px] overflow-y-auto p-4 custom-scrollbar"
                >
                  {messages.length ? (
                    <div className="space-y-3">
                      {messages.map((m, idx) => (
                        <MessageBubble key={String(m.message_id ?? idx)} msg={m} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No messages yet.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1">
                      <Label>Message</Label>
                      <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={wsStatus !== "open" || !text.trim()}
                      onClick={() => send()}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: WsMessage }) {
  const isSystem = String(msg.message_type || "").toLowerCase() === "system";
  const st = String(msg.sender_type || "").toLowerCase();
  const isAdmin = st === "admin" || st === "initiator";
  const isUser = st === "user" || st === "receiver";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          {msg.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isAdmin ? "justify-end" : isUser ? "justify-start" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isAdmin
            ? "bg-brand-500 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-white/[0.06] dark:text-white/90"
        }`}
      >
        <div className="flex items-center gap-2 text-[11px] opacity-90">
          <span className="font-medium">
            {msg.sender_name ? String(msg.sender_name) : isAdmin ? "Admin" : "User"}
          </span>
          {msg.order_id ? <span className="opacity-80">• order #{msg.order_id}</span> : null}
          {msg.created_at ? (
            <span className="ml-auto opacity-80">
              {new Date(String(msg.created_at)).toLocaleString()}
            </span>
          ) : null}
        </div>
        <div className="mt-1 whitespace-pre-wrap">{msg.message}</div>
      </div>
    </div>
  );
}

