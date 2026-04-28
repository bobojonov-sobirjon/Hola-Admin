import Badge from "../../components/ui/badge/Badge";

export type ApiListEnvelope<T> = {
  status?: string;
  message?: string;
  count?: number;
  data?: T[];
};

export type ApiDetailEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
};

export type ActiveItem = {
  id: number;
  title?: string;
  description?: string | null;
  is_active?: boolean;
  updated_at?: string;
  created_at?: string;
};

export function YesNoBadge({ value }: { value: boolean }) {
  return (
    <Badge size="sm" color={value ? "success" : "warning"}>
      {value ? "Yes" : "No"}
    </Badge>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

