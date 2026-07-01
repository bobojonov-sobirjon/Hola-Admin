import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ComponentCard from "../common/ComponentCard";
import PickDropAddressCell from "../../pages/Orders/PickDropAddressCell";
import {
  extractRouteFromOrderItem,
  fetchDrivingRoute,
  formatDistanceKm,
  formatDuration,
  geocodeAddress,
  haversineKm,
  type LatLng,
} from "../../utils/routeMapUtils";

type AnyObj = Record<string, unknown>;

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);
  return null;
}

function MapRoute({
  pickup,
  dropoff,
  routeLine,
}: {
  pickup: LatLng;
  dropoff: LatLng;
  routeLine: [number, number][];
}) {
  const center: [number, number] = [
    (pickup.lat + dropoff.lat) / 2,
    (pickup.lng + dropoff.lng) / 2,
  ];

  return (
    <div className="h-full min-h-[380px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={routeLine}
          pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.92 }}
        />
        <CircleMarker
          center={[pickup.lat, pickup.lng]}
          radius={11}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#16a34a",
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="!border-0 !bg-green-600 !text-white !font-semibold">
            A · Pickup
          </Tooltip>
        </CircleMarker>
        <CircleMarker
          center={[dropoff.lat, dropoff.lng]}
          radius={11}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#dc2626",
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="!border-0 !bg-red-600 !text-white !font-semibold">
            B · Drop-off
          </Tooltip>
        </CircleMarker>
        <FitBounds points={[pickup, dropoff]} />
      </MapContainer>
    </div>
  );
}

export default function OrderRouteMap({ orderItems }: { orderItems: AnyObj[] }) {
  const primaryItem = orderItems[0] ?? null;
  const base = useMemo(() => extractRouteFromOrderItem(primaryItem), [primaryItem]);

  const [pickup, setPickup] = useState<LatLng | null>(base.pickup);
  const [dropoff, setDropoff] = useState<LatLng | null>(base.dropoff);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(base.distanceKm);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      setLoading(true);
      setMapError(null);
      setRouteLine([]);
      setDurationSec(null);

      let from = base.pickup;
      let to = base.dropoff;

      try {
        if (!from && base.addressFrom) {
          from = await geocodeAddress(base.addressFrom);
        }
        if (!to && base.addressTo) {
          await new Promise((r) => setTimeout(r, 350));
          to = await geocodeAddress(base.addressTo);
        }

        if (cancelled) return;

        if (!from || !to) {
          setPickup(from);
          setDropoff(to);
          setMapError("Could not locate pickup or drop-off on the map.");
          return;
        }

        setPickup(from);
        setDropoff(to);

        const osrm = await fetchDrivingRoute(from, to);
        if (cancelled) return;

        if (osrm?.coordinates?.length) {
          setRouteLine(osrm.coordinates);
          setDistanceKm(
            base.distanceKm !== null ? base.distanceKm : osrm.distanceMeters / 1000
          );
          setDurationSec(osrm.durationSeconds);
        } else {
          setRouteLine([
            [from.lat, from.lng],
            [to.lat, to.lng],
          ]);
          setDistanceKm(base.distanceKm ?? haversineKm(from, to));
        }
      } catch {
        if (!cancelled) setMapError("Failed to load route map.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!primaryItem) {
      setPickup(null);
      setDropoff(null);
      setRouteLine([]);
      setDistanceKm(null);
      setDurationSec(null);
      return;
    }

    void resolveRoute();
    return () => {
      cancelled = true;
    };
  }, [primaryItem, base.addressFrom, base.addressTo, base.pickup, base.dropoff, base.distanceKm]);

  if (!primaryItem) {
    return (
      <ComponentCard title="Route map" desc="Pickup and drop-off">
        <div className="text-sm text-gray-500 dark:text-gray-400">No route data.</div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title="Route map" desc="Point A → Point B with driving distance">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {loading ? (
            <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              Loading map…
            </div>
          ) : pickup && dropoff && routeLine.length ? (
            <MapRoute pickup={pickup} dropoff={dropoff} routeLine={routeLine} />
          ) : (
            <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
              {mapError || "Map unavailable for this order."}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Distance
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
              {formatDistanceKm(distanceKm)}
            </div>
            {durationSec !== null ? (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Est. drive time: {formatDuration(durationSec)}
              </div>
            ) : null}
            {base.distanceKm !== null && distanceKm !== null && base.distanceKm !== distanceKm ? (
              <div className="mt-1 text-xs text-gray-400">
                API distance: {formatDistanceKm(base.distanceKm)}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Addresses
            </div>
            <PickDropAddressCell
              from={base.addressFrom || "—"}
              to={base.addressTo || "—"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900/40 dark:bg-green-950/20">
              <div className="text-xs font-semibold text-green-700 dark:text-green-400">Point A</div>
              <div className="mt-1 text-xs text-green-800 dark:text-green-300">Pickup</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="text-xs font-semibold text-red-700 dark:text-red-400">Point B</div>
              <div className="mt-1 text-xs text-red-800 dark:text-red-300">Drop-off</div>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}
