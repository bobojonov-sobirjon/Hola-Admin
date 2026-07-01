export type LatLng = { lat: number; lng: number };

type AnyObj = Record<string, unknown>;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickStr(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pairFromKeys(obj: AnyObj, latKeys: string[], lngKeys: string[]): LatLng | null {
  for (const lk of latKeys) {
    for (const lg of lngKeys) {
      const lat = num(obj[lk]);
      const lng = num(obj[lg]);
      if (lat !== null && lng !== null) return { lat, lng };
    }
  }
  return null;
}

export function extractPickupPoint(item: AnyObj): LatLng | null {
  return pairFromKeys(
    item,
    [
      "lat_from",
      "latitude_from",
      "from_lat",
      "pickup_lat",
      "pickup_latitude",
      "start_lat",
      "origin_lat",
    ],
    [
      "lng_from",
      "longitude_from",
      "from_lng",
      "from_lon",
      "pickup_lng",
      "pickup_longitude",
      "pickup_lon",
      "start_lng",
      "start_lon",
      "origin_lng",
    ]
  );
}

export function extractDropoffPoint(item: AnyObj): LatLng | null {
  return pairFromKeys(
    item,
    [
      "lat_to",
      "latitude_to",
      "to_lat",
      "dropoff_lat",
      "dropoff_latitude",
      "end_lat",
      "destination_lat",
    ],
    [
      "lng_to",
      "longitude_to",
      "to_lng",
      "to_lon",
      "dropoff_lng",
      "dropoff_longitude",
      "dropoff_lon",
      "end_lng",
      "end_lon",
      "destination_lng",
    ]
  );
}

export function extractRouteFromOrderItem(item: AnyObj | null) {
  if (!item) {
    return {
      addressFrom: "",
      addressTo: "",
      pickup: null as LatLng | null,
      dropoff: null as LatLng | null,
      distanceKm: null as number | null,
    };
  }

  const distanceKm = num(item.distance_km);

  return {
    addressFrom: pickStr(item.address_from),
    addressTo: pickStr(item.address_to),
    pickup: extractPickupPoint(item),
    dropoff: extractDropoffPoint(item),
    distanceKm,
  };
}

export function haversineKm(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (!address.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data?.[0];
    const lat = num(first?.lat);
    const lng = num(first?.lon);
    if (lat === null || lng === null) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

type OsrmRoute = {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
};

export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng
): Promise<OsrmRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!route || !coords?.length) return null;
    return {
      distanceMeters: route.distance ?? 0,
      durationSeconds: route.duration ?? 0,
      coordinates: coords.map(([lng, lat]) => [lat, lng] as [number, number]),
    };
  } catch {
    return null;
  }
}

export function formatDistanceKm(km: number | null) {
  if (km === null || !Number.isFinite(km)) return "—";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
