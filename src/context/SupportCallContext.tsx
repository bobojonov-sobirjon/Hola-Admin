import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getErrorMessage } from "../config/api";
import { joinAgoraVoiceCall, leaveAgoraVoiceCall } from "../services/agoraVoiceCall";
import { stopCallRingtone } from "../services/callRingtone";
import {
  acceptVoiceCall,
  endVoiceCall,
  fetchSupportDuty,
  rejectVoiceCall,
  updateSupportDuty,
} from "../services/voiceCallApi";
import type {
  AgoraCredentials,
  IncomingCallPayload,
  VoiceCallRecord,
} from "../services/voiceCallTypes";
import {
  disconnectVoiceCallWs,
  getVoiceCallWsState,
  subscribeVoiceCallWs,
} from "../services/wsVoiceCall";
import { isAuthVerified } from "../utils/authUser";

function resolveAgoraCredentials(call: VoiceCallRecord): AgoraCredentials | null {
  if (
    call.agora?.app_id &&
    call.agora.channel_name &&
    call.agora.token &&
    call.agora.uid != null
  ) {
    return call.agora;
  }
  if (call.agora_app_id && call.agora_channel_name && call.agora?.token) {
    return {
      app_id: call.agora_app_id,
      channel_name: call.agora_channel_name,
      token: call.agora.token,
      uid: call.agora.uid,
      expires_at: call.agora.expires_at,
    };
  }
  return null;
}

type SupportCallContextValue = {
  enabled: boolean;
  isOnDuty: boolean;
  dutyLoading: boolean;
  wsConnected: boolean;
  incomingCall: IncomingCallPayload | null;
  activeCall: VoiceCallRecord | null;
  actionLoading: boolean;
  error: string | null;
  setOnDuty: (value: boolean) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: (reason?: string) => Promise<void>;
  endActiveCall: (reason?: string) => Promise<void>;
  clearError: () => void;
};

const SupportCallContext = createContext<SupportCallContextValue | null>(null);

function callIdFromPayload(payload?: Record<string, unknown> | IncomingCallPayload | null) {
  if (!payload) return null;
  const raw =
    "call_id" in payload && payload.call_id != null
      ? payload.call_id
      : "id" in payload
        ? payload.id
        : null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function SupportCallProvider({ children }: { children: React.ReactNode }) {
  const enabled = isAuthVerified();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [activeCall, setActiveCall] = useState<VoiceCallRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissedCallIdsRef = useRef<Map<number, number>>(new Map());

  const markCallDismissed = useCallback((callId: number) => {
    dismissedCallIdsRef.current.set(callId, Date.now());
  }, []);

  const isCallDismissed = useCallback((callId: number) => {
    const dismissedAt = dismissedCallIdsRef.current.get(callId);
    if (!dismissedAt) return false;
    if (Date.now() - dismissedAt > 60_000) {
      dismissedCallIdsRef.current.delete(callId);
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const duty = await fetchSupportDuty();
        if (!cancelled) setIsOnDuty(Boolean(duty.is_on_duty));
      } catch {
        // ignore on boot
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const resetCallState = useCallback(async () => {
    stopCallRingtone();
    setIncomingCall(null);
    setActiveCall(null);
    await leaveAgoraVoiceCall();
  }, []);

  useEffect(() => {
    if (!enabled || !isOnDuty) {
      disconnectVoiceCallWs();
      setWsConnected(false);
      return;
    }

    const unsub = subscribeVoiceCallWs((event) => {
      if (event.type === "connection_established") {
        setWsConnected(true);
        return;
      }

      const eventCallId = callIdFromPayload(event.payload as Record<string, unknown>);

      if (event.type === "incoming_call") {
        if (activeCall) return;
        if (eventCallId && isCallDismissed(eventCallId)) return;
        setIncomingCall(event.payload);
        return;
      }

      if (event.type === "call_cancelled" || event.type === "call_rejected") {
        stopCallRingtone();
        setIncomingCall((prev) => {
          const prevId = callIdFromPayload(prev);
          if (prevId && eventCallId && prevId !== eventCallId) return prev;
          return null;
        });
        return;
      }

      if (event.type === "call_accepted") {
        setIncomingCall((prev) => {
          const prevId = callIdFromPayload(prev);
          if (prevId && eventCallId && prevId === eventCallId) return null;
          return prev;
        });
        return;
      }

      if (event.type === "call_ended") {
        const activeId = activeCall?.id;
        if (activeId && eventCallId && activeId !== eventCallId) return;
        void resetCallState();
      }
    });

    const timer = window.setInterval(() => {
      setWsConnected(getVoiceCallWsState() === "open");
    }, 1000);

    return () => {
      window.clearInterval(timer);
      unsub();
      setWsConnected(false);
    };
  }, [enabled, isOnDuty, activeCall, resetCallState, isCallDismissed]);

  const setOnDuty = useCallback(
    async (value: boolean) => {
      if (!enabled) return;
      setDutyLoading(true);
      setError(null);
      try {
        const duty = await updateSupportDuty(value);
        setIsOnDuty(Boolean(duty?.is_on_duty));
        if (!value) {
          await resetCallState();
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setDutyLoading(false);
      }
    },
    [enabled, resetCallState]
  );

  const acceptIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const callId = incomingCall.call_id;
    stopCallRingtone();
    setIncomingCall(null);
    setActionLoading(true);
    setError(null);
    try {
      const res = await acceptVoiceCall(callId);
      const call = res.data;
      if (!call) throw new Error("Call missing in accept response");
      setActiveCall(call);
      const agora = resolveAgoraCredentials(call);
      if (!agora) throw new Error("Agora credentials missing in accept response");
      await joinAgoraVoiceCall(agora);
    } catch (e) {
      setActiveCall(null);
      await leaveAgoraVoiceCall();
      setError(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  }, [incomingCall]);

  const rejectIncoming = useCallback(
    async (reason = "busy") => {
      if (!incomingCall) return;
      const callId = incomingCall.call_id;
      markCallDismissed(callId);
      stopCallRingtone();
      setIncomingCall(null);
      setActionLoading(true);
      setError(null);
      try {
        await rejectVoiceCall(callId, reason);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setActionLoading(false);
      }
    },
    [incomingCall, markCallDismissed]
  );

  const endActiveCall = useCallback(
    async (reason = "resolved") => {
      if (!activeCall) return;
      setActionLoading(true);
      setError(null);
      try {
        await endVoiceCall(activeCall.id, reason);
        await resetCallState();
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setActionLoading(false);
      }
    },
    [activeCall, resetCallState]
  );

  const value = useMemo(
    () => ({
      enabled,
      isOnDuty,
      dutyLoading,
      wsConnected,
      incomingCall,
      activeCall,
      actionLoading,
      error,
      setOnDuty,
      acceptIncoming,
      rejectIncoming,
      endActiveCall,
      clearError: () => setError(null),
    }),
    [
      enabled,
      isOnDuty,
      dutyLoading,
      wsConnected,
      incomingCall,
      activeCall,
      actionLoading,
      error,
      setOnDuty,
      acceptIncoming,
      rejectIncoming,
      endActiveCall,
    ]
  );

  return (
    <SupportCallContext.Provider value={value}>{children}</SupportCallContext.Provider>
  );
}

export function useSupportCall() {
  const ctx = useContext(SupportCallContext);
  if (!ctx) throw new Error("useSupportCall must be used within SupportCallProvider");
  return ctx;
}

export function useSupportCallOptional() {
  return useContext(SupportCallContext);
}
