import { BASE_URL, getAuthHeaders, getJson, patchJson, postJson } from "../config/api";
import type {
  ApiEnvelope,
  SupportDuty,
  VoiceCallRecord,
} from "./voiceCallTypes";

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function fetchSupportDuty() {
  const res = await getJson<ApiEnvelope<SupportDuty>>("voice-call/support-duty/", {
    headers: getAuthHeaders(),
  });
  return res.data ?? { admin_id: 0, is_on_duty: false, updated_at: null };
}

export async function updateSupportDuty(isOnDuty: boolean) {
  const res = await postJson<ApiEnvelope<SupportDuty>>(
    "voice-call/support-duty/",
    { is_on_duty: isOnDuty },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function fetchVoiceCalls(params?: {
  call_type?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return getJson<ApiEnvelope<VoiceCallRecord[]>>(
    `admin-panel/voice-calls/${qs({
      call_type: params?.call_type,
      status: params?.status,
      page: params?.page,
      page_size: params?.page_size,
    })}`,
    { headers: getAuthHeaders() }
  );
}

export async function fetchVoiceCall(id: number) {
  const res = await getJson<ApiEnvelope<VoiceCallRecord>>(
    `admin-panel/voice-calls/${id}/`,
    { headers: getAuthHeaders() }
  );
  return res.data ?? null;
}

export async function acceptVoiceCall(id: number) {
  return postJson<ApiEnvelope<VoiceCallRecord>>(
    `admin-panel/voice-calls/${id}/accept/`,
    {},
    { headers: getAuthHeaders() }
  );
}

export async function rejectVoiceCall(id: number, reason?: string) {
  return postJson<ApiEnvelope<VoiceCallRecord>>(
    `admin-panel/voice-calls/${id}/reject/`,
    reason ? { reason } : {},
    { headers: getAuthHeaders() }
  );
}

export async function endVoiceCall(id: number, reason?: string) {
  return postJson<ApiEnvelope<VoiceCallRecord>>(
    `admin-panel/voice-calls/${id}/end/`,
    reason ? { reason } : { reason: "resolved" },
    { headers: getAuthHeaders() }
  );
}

export async function saveVoiceCallNote(id: number, operatorNote: string) {
  return patchJson<ApiEnvelope<VoiceCallRecord>>(
    `admin-panel/voice-calls/${id}/note/`,
    { operator_note: operatorNote },
    { headers: getAuthHeaders() }
  );
}

export function deriveWsBaseFromApi(): string | null {
  const b = String(BASE_URL || "").trim();
  if (!b || !/^https?:\/\//i.test(b)) return null;
  try {
    const u = new URL(b);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}`;
  } catch {
    return null;
  }
}
