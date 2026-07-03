import { useEffect } from "react";
import { startCallRingtone, stopCallRingtone } from "../services/callRingtone";

export function useCallRingtone(active: boolean) {
  useEffect(() => {
    if (active) {
      startCallRingtone();
    } else {
      stopCallRingtone();
    }
    return () => {
      stopCallRingtone();
    };
  }, [active]);
}
