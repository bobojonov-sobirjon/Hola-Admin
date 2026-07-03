export type VoiceCallUser = {
  id: number;
  full_name?: string;
  email?: string;
};

export type VoiceCallType = "rider_support" | "driver_support" | "trip";
export type VoiceCallStatus =
  | "ringing"
  | "answered"
  | "ended"
  | "missed"
  | "rejected"
  | "cancelled";

export type AgoraCredentials = {
  app_id: string;
  channel_name: string;
  token: string;
  uid: number;
  expires_at?: number;
};

export type IncomingCallPayload = {
  call_id: number;
  call_type: VoiceCallType;
  status: string;
  order_id?: number | null;
  support_room_id?: number | null;
  channel_name?: string;
  app_id?: string;
  initiator_role?: string;
  ring_started_at?: string;
  caller?: VoiceCallUser | null;
  callee?: VoiceCallUser | null;
};

export type VoiceCallRecord = {
  id: number;
  call_type: VoiceCallType;
  status: VoiceCallStatus | string;
  order_id?: number | null;
  order_code?: string | null;
  support_room_id?: number | null;
  initiator_role?: string;
  ring_started_at?: string | null;
  answered_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  operator_note?: string | null;
  caller?: VoiceCallUser | null;
  callee?: VoiceCallUser | null;
  created_at?: string;
  agora_channel_name?: string;
  agora_app_id?: string;
  agora?: AgoraCredentials;
};

export type SupportDuty = {
  admin_id: number;
  is_on_duty: boolean;
  updated_at: string | null;
};

export type ApiEnvelope<T> = {
  message?: string;
  status?: string;
  data?: T;
  count?: number;
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
};

export function formatCallType(value?: string) {
  if (value === "rider_support") return "Rider support";
  if (value === "driver_support") return "Driver support";
  if (value === "trip") return "Trip";
  return value || "—";
}

export function formatCallStatus(value?: string) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}
