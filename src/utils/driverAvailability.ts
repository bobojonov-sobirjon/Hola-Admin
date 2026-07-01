export type OnlineStatus = {
  is_online?: boolean;
  status?: string;
};

export type DriverCurrentLocation = {
  latitude?: string | number | null;
  longitude?: string | number | null;
  updated_at?: string | null;
  has_location?: boolean;
};

export function getDriverOnlineInfo(driver: {
  online_status?: OnlineStatus | null;
  is_online?: boolean;
}) {
  const os = driver.online_status;
  if (os && typeof os === "object") {
    const isOnline = !!os.is_online;
    const label = (os.status || (isOnline ? "online" : "offline")).trim();
    return {
      isOnline,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
  }
  const isOnline = !!driver.is_online;
  return {
    isOnline,
    label: isOnline ? "Online" : "Offline",
  };
}

export function parseDriverLocation(loc?: DriverCurrentLocation | null) {
  if (!loc?.has_location) return null;
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, updatedAt: loc.updated_at ?? null };
}
