import Badge from "../components/ui/badge/Badge";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

function normalizeStatus(status: string) {
  return status.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

export function getOrderStatusBadgeColor(status: string): BadgeColor {
  const s = normalizeStatus(status);

  if (!s) return "light";

  if (s === "completed" || s.includes("complete")) return "success";
  if (
    s === "cancelled" ||
    s === "canceled" ||
    s === "rejected" ||
    s.includes("cancel") ||
    s.includes("reject")
  ) {
    return "error";
  }
  if (s === "pending") return "primary";
  if (s === "scheduled") return "info";
  if (s === "accepted") return "info";
  if (s === "on_the_way" || s === "ontheway") return "warning";
  if (s === "arrived") return "dark";
  if (s === "in_progress" || s === "inprogress") return "warning";
  if (s === "timeout" || s === "expired") return "error";
  if (s === "active" || s === "running") return "warning";

  return "light";
}

export default function OrderStatusBadge({
  status,
  label,
  size = "sm",
  variant = "solid",
}: {
  status?: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "light" | "solid";
}) {
  const raw = status || "";
  const text = (label || raw || "-").trim() || "-";

  return (
    <Badge size={size} variant={variant} color={getOrderStatusBadgeColor(raw)}>
      {text}
    </Badge>
  );
}
