import { useSupportCallOptional } from "../../context/SupportCallContext";
import Button from "../ui/button/Button";

export default function SupportDutyToggle() {
  const ctx = useSupportCallOptional();
  if (!ctx?.enabled) return null;

  if (ctx.activeCall) {
    const caller =
      ctx.activeCall.caller?.full_name?.trim() &&
      ctx.activeCall.caller.full_name.toLowerCase() !== "string"
        ? ctx.activeCall.caller.full_name
        : ctx.activeCall.caller?.email || "Caller";

    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-xs font-medium text-success-600 dark:text-success-400 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          On call: {caller}
        </span>
        <Button
          size="sm"
          disabled={ctx.actionLoading}
          onClick={() => void ctx.endActiveCall("resolved")}
        >
          {ctx.actionLoading ? "Ending..." : "End call"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`hidden h-2 w-2 rounded-full sm:inline-block ${
          ctx.isOnDuty && ctx.wsConnected ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      />
      <Button
        size="sm"
        variant={ctx.isOnDuty ? "primary" : "outline"}
        disabled={ctx.dutyLoading || Boolean(ctx.activeCall)}
        onClick={() => void ctx.setOnDuty(!ctx.isOnDuty)}
      >
        {ctx.dutyLoading
          ? "Updating..."
          : ctx.isOnDuty
            ? "On duty"
            : "Go on duty"}
      </Button>
    </div>
  );
}
