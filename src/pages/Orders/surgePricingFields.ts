import type { FieldDef } from "./CrudFormModal";

export const SURGE_DEFAULT_CENTER = {
  latitude: "39.8046579",
  longitude: "64.4263534",
  radius_km: "5.0",
};

export const SURGE_CREATE_INITIAL = {
  name: "Rush hour",
  multiplier: "1.50",
  start_time: "17:00",
  end_time: "20:00",
  days_of_week: [0, 1, 2, 3, 4],
  zone_name: "Downtown",
  ...SURGE_DEFAULT_CENTER,
  min_available_drivers: 1,
  max_available_drivers: 3,
  priority: 10,
  is_active: true,
};

export const SURGE_FORM_FIELDS: FieldDef[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    help: "Admin-only title for this rule (e.g. Rush hour). Used in the list to identify the surge.",
  },
  {
    key: "multiplier",
    label: "Multiplier",
    type: "text",
    help: "Fare multiplier inside the zone when all conditions match. 1.50 = base price + 50%. Sent to the API as the surge rate.",
  },
  {
    key: "start_time",
    label: "Start time",
    type: "time",
    help: "Local time when surge starts on each selected weekday. Rider quotes after this time can include surge if they are in the zone.",
  },
  {
    key: "end_time",
    label: "End time",
    type: "time",
    help: "Local time when surge stops for the day. Pickup must fall between start and end time for the rule to apply.",
  },
  {
    key: "days_of_week",
    label: "Days of week",
    type: "array-number",
    placeholder: "0,1,2,3,4",
    hint: "Example: 0,1,2,3,4 (0 = Monday)",
    help: "Which weekdays this rule is active. Numbers 0–6 where 0 = Monday. Example: 0,1,2,3,4 = Monday through Friday.",
  },
  {
    key: "zone_name",
    label: "Zone name",
    type: "text",
    help: "Display name for the area (e.g. Downtown). For admin reference only; does not affect pricing logic.",
  },
  {
    key: "_surge_zone_map",
    label: "Surge zone",
    type: "surge-zone-map",
    latKey: "latitude",
    lngKey: "longitude",
    radiusKey: "radius_km",
    zoneNameKey: "zone_name",
    help: "Geographic center and radius (miles) of the surge area. Search an address or click/drag the pin. If the rider pickup is inside the circle during active hours, the multiplier applies.",
  },
  {
    key: "min_available_drivers",
    label: "Min available drivers",
    type: "number",
    help: "Minimum online drivers required near the zone for surge to activate. Use with max to target busy periods.",
  },
  {
    key: "max_available_drivers",
    label: "Max available drivers",
    type: "number",
    help: "Surge applies only when available drivers are at or below this count. Example: max 3 means surge when supply is low (≤3 drivers).",
  },
  {
    key: "priority",
    label: "Priority",
    type: "number",
    help: "When multiple surge rules overlap the same pickup, the rule with the higher priority number wins.",
  },
  {
    key: "is_active",
    label: "Active",
    type: "checkbox",
    help: "When checked, this rule is live and can affect rider prices. Uncheck to disable without deleting.",
  },
];

function normalizeTimeForInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  const part = value.trim().split(" ")[0];
  return part.length >= 5 ? part.slice(0, 5) : part;
}

export function surgeItemToFormValues(item: Record<string, unknown>) {
  return {
    ...item,
    start_time: normalizeTimeForInput(item.start_time),
    end_time: normalizeTimeForInput(item.end_time),
    days_of_week: Array.isArray(item.days_of_week)
      ? item.days_of_week.join(", ")
      : item.days_of_week,
    latitude:
      item.latitude === null || item.latitude === undefined
        ? ""
        : String(item.latitude),
    longitude:
      item.longitude === null || item.longitude === undefined
        ? ""
        : String(item.longitude),
    radius_km:
      item.radius_km === null || item.radius_km === undefined
        ? ""
        : String(item.radius_km),
  };
}
