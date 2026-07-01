const KM_PER_MILE = 1.609344;

export const SURGE_MIN_RADIUS_MI = 1;
export const SURGE_MAX_RADIUS_MI = 20;
export const SURGE_DEFAULT_RADIUS_KM = 5;

export function kmToMiles(km: number) {
  return km / KM_PER_MILE;
}

export function milesToKm(miles: number) {
  return miles * KM_PER_MILE;
}

export function parseRadiusMilesFromKm(value: string | number | null | undefined) {
  const km = Number(value);
  const miles = Number.isFinite(km) ? kmToMiles(km) : kmToMiles(SURGE_DEFAULT_RADIUS_KM);
  return Math.min(SURGE_MAX_RADIUS_MI, Math.max(SURGE_MIN_RADIUS_MI, miles));
}

export function formatRadiusKmForApi(miles: number) {
  return milesToKm(miles).toFixed(2);
}

export function formatRadiusMilesDisplay(value: string | number | null | undefined) {
  return `${parseRadiusMilesFromKm(value).toFixed(1)} mi`;
}
