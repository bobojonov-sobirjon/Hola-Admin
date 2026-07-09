import iconPremiumLarge from "../icons/vehicle_type/1ff228d30ba956a87eafa6f126e5868459723fbb.png";
import iconPremium from "../icons/vehicle_type/be373b44d1a4207b7c8f4be90001e28e738553d9.png";
import iconEvLarge from "../icons/vehicle_type/86a423a4bf27721e9bda27f799e6f9a84975c7d9.png";
import iconEv from "../icons/vehicle_type/cf3552b335ff00a5b8aff2d4cb2bfe730f8726d3.png";
import iconHolaLarge from "../icons/vehicle_type/b3526e2e4551f929bd49eea7a9e394ccbf61803e.png";
import iconHola from "../icons/vehicle_type/f663c3d5357e704e91e115875978389bcc4cb069.png";

export type RideTypeLike = {
  id?: number;
  name?: string | null;
  name_large?: string | null;
  icon?: string | null;
  is_premium?: boolean;
  is_ev?: boolean;
};

const ICON_BY_SLUG: Record<string, string> = {
  hola: iconHola,
  hola_large: iconHolaLarge,
  premium: iconPremium,
  premium_large: iconPremiumLarge,
  hola_ev: iconEv,
  hola_ev_large: iconEvLarge,
};

function normalizeSlug(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isLargeVariant(item: RideTypeLike, slug: string) {
  if (slug.includes("large")) return true;
  const name = normalizeSlug(item.name);
  const nameLarge = normalizeSlug(item.name_large);
  return Boolean(nameLarge && nameLarge !== name && nameLarge.endsWith("_large"));
}

export function getVehicleTypeIcon(item: RideTypeLike): string {
  const slug = normalizeSlug(item.icon) || normalizeSlug(item.name);
  if (slug && ICON_BY_SLUG[slug]) return ICON_BY_SLUG[slug];

  const large = isLargeVariant(item, slug);
  if (item.is_ev) return large ? iconEvLarge : iconEv;
  if (item.is_premium) return large ? iconPremiumLarge : iconPremium;
  return large ? iconHolaLarge : iconHola;
}

export function formatVehicleTypeName(item: RideTypeLike) {
  const slug = item.name?.trim() || "—";
  const display = item.name_large?.trim();
  const primary = display && display.toLowerCase() !== slug.toLowerCase() ? display : slug;
  const secondary =
    display && primary !== slug && slug.toLowerCase() !== "string" ? slug : undefined;
  return { primary, secondary };
}

export function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `$${n.toFixed(2)}`;
}
