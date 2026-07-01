import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ComponentCard from "../common/ComponentCard";
import type { DriverCurrentLocation } from "../../utils/driverAvailability";
import { parseDriverLocation } from "../../utils/driverAvailability";

function CenterOnDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [map, lat, lng]);
  return null;
}

export default function DriverLastLocationMap({
  location,
  driverName,
}: {
  location?: DriverCurrentLocation | null;
  driverName?: string;
}) {
  const point = parseDriverLocation(location);

  return (
    <ComponentCard title="Last location" desc="Latest GPS from driver app">
      {point ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">Latitude</div>
              <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {point.lat.toFixed(6)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">Longitude</div>
              <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {point.lng.toFixed(6)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400">Updated at</div>
              <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {point.updatedAt
                  ? new Date(point.updatedAt).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>

          <div className="h-[380px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <MapContainer
              center={[point.lat, point.lng]}
              zoom={15}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[point.lat, point.lng]}
                radius={12}
                pathOptions={{
                  color: "#ffffff",
                  weight: 3,
                  fillColor: "#2563eb",
                  fillOpacity: 1,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  {driverName ? `${driverName}` : "Driver location"}
                </Tooltip>
              </CircleMarker>
              <CenterOnDriver lat={point.lat} lng={point.lng} />
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
          No location shared yet. Driver has not sent GPS via the mobile app.
        </div>
      )}
    </ComponentCard>
  );
}
