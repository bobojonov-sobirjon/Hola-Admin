import Badge from "../../components/ui/badge/Badge";

export type ApiListEnvelope<T> = {
  status?: string;
  message?: string;
  count?: number;
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  filter?: string | null;
  data?: T[];
};

export type ApiDetailEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
};

export function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function YesNo({ value }: { value: boolean }) {
  return (
    <Badge size="sm" color={value ? "success" : "warning"}>
      {value ? "Yes" : "No"}
    </Badge>
  );
}

export function pickTitleLike(obj: Record<string, unknown>) {
  const candidates = [
    "name",
    "title",
    "code",
    "nickname",
    "status",
    "status_display",
    "email",
    "full_name",
    "id",
  ];
  for (const k of candidates) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return "-";
}

export function getId(obj: Record<string, unknown>) {
  const v = obj.id;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

export function flattenPrimitiveFields(obj: Record<string, unknown>) {
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out.push({ key: k, value: String(v) });
    } else if (Array.isArray(v)) {
      out.push({ key: k, value: `Array(${v.length})` });
    } else if (typeof v === "object") {
      out.push({ key: k, value: "Object" });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export function isDateLikeKey(key: string) {
  const k = key.toLowerCase();
  return k.endsWith("_at") || k.endsWith("_date");
}

export function prettyFieldName(key: string) {
  const special: Record<string, string> = {
    id: "ID",
    uuid: "UUID",
    vin: "VIN",
    km: "KM",
    lat: "Lat",
    lng: "Lng",
    ip: "IP",
  };

  return key
    .split("_")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (special[lower]) return special[lower];
      if (lower.length <= 2) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

