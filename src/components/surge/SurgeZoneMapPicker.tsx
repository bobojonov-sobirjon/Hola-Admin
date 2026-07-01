import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "../ui/button/Button";
import FieldHelpTip from "../common/FieldHelpTip";
import {
  geocodePlaceQuery,
  reverseGeocodePlaceName,
} from "../../utils/routeMapUtils";
import {
  formatRadiusKmForApi,
  milesToKm,
  parseRadiusMilesFromKm,
  SURGE_MAX_RADIUS_MI,
  SURGE_MIN_RADIUS_MI,
} from "../../utils/surgeRadiusUtils";

const DEFAULT_LAT = 39.8046579;
const DEFAULT_LNG = 64.4263534;

const centerPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function parseCoord(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function MapClickHandler({
  onPick,
  readOnly,
}: {
  onPick: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (readOnly) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitZoneBounds({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    const latOffset = radiusKm / 111.32;
    const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    map.fitBounds(
      [
        [lat - latOffset, lng - lngOffset],
        [lat + latOffset, lng + lngOffset],
      ],
      { padding: [32, 32], maxZoom: 15 }
    );
  }, [map, lat, lng, radiusKm]);
  return null;
}

export default function SurgeZoneMapPicker({
  latitude,
  longitude,
  radiusKm,
  onChange,
  onSuggestZoneName,
  readOnly = false,
  compact = false,
}: {
  latitude: string;
  longitude: string;
  radiusKm: string;
  onChange?: (patch: {
    latitude: string;
    longitude: string;
    radius_km: string;
  }) => void;
  onSuggestZoneName?: (name: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const lat = parseCoord(latitude, DEFAULT_LAT);
  const lng = parseCoord(longitude, DEFAULT_LNG);
  const radiusMiles = parseRadiusMilesFromKm(radiusKm);
  const radiusKmValue = milesToKm(radiusMiles);
  const suggestRef = useRef(onSuggestZoneName);
  suggestRef.current = onSuggestZoneName;
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const position = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  function emitRadius(miles: number) {
    onChange?.({
      latitude: latitude || String(DEFAULT_LAT),
      longitude: longitude || String(DEFAULT_LNG),
      radius_km: formatRadiusKmForApi(miles),
    });
  }

  function pickPoint(nextLat: number, nextLng: number) {
    if (readOnly || !onChange) return;
    onChange({
      latitude: nextLat.toFixed(7),
      longitude: nextLng.toFixed(7),
      radius_km: formatRadiusKmForApi(radiusMiles),
    });
  }

  async function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const query = searchInput.trim();
    if (!query || readOnly) return;
    setSearchError(null);
    setSearching(true);
    try {
      const result = await geocodePlaceQuery(query);
      if (!result) {
        setSearchError("Location not found. Try city, street, or place name.");
        return;
      }
      pickPoint(result.lat, result.lng);
      suggestRef.current?.(result.label);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (readOnly || !suggestRef.current) return;
    const timer = window.setTimeout(async () => {
      const name = await reverseGeocodePlaceName(lat, lng);
      if (name) suggestRef.current?.(name);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [lat, lng, readOnly]);

  return (
    <div className="space-y-3">
      {!readOnly ? (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Search a place, click the map, or drag the pin. Adjust radius (miles) with the slider.
          </p>
          <form className="flex flex-wrap items-center gap-2" onSubmit={submitSearch}>
            <div className="flex min-w-[200px] flex-1 items-center gap-1.5">
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                placeholder="Search city, street, place..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <FieldHelpTip text="Search city, street, or place name. The map and zone center move to the first match." />
            </div>
            <Button size="sm" disabled={searching || !searchInput.trim()}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>
          {searchError ? (
            <p className="text-xs text-error-600 dark:text-error-400">{searchError}</p>
          ) : null}
        </>
      ) : null}

      <div
        className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 ${compact ? "h-[400px]" : "h-[480px]"}`}
      >
        <MapContainer
          center={position}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={!readOnly && !compact}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={pickPoint} readOnly={readOnly} />
          <Circle
            center={position}
            radius={radiusKmValue * 1000}
            pathOptions={{
              color: "#2563eb",
              weight: 2,
              fillColor: "#2563eb",
              fillOpacity: 0.15,
            }}
          />
          <Marker
            position={position}
            icon={centerPinIcon}
            draggable={!readOnly}
            eventHandlers={
              readOnly
                ? undefined
                : {
                    dragend(e) {
                      const pos = e.target.getLatLng();
                      pickPoint(pos.lat, pos.lng);
                    },
                  }
            }
          />
          <FitZoneBounds lat={lat} lng={lng} radiusKm={radiusKmValue} />
        </MapContainer>
      </div>

      {!readOnly ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              Radius: <strong>{radiusMiles.toFixed(1)} mi</strong>
              <FieldHelpTip text="Distance in miles from the center pin where surge applies. Pickups inside this circle get the multiplier when other conditions match." />
            </span>
            <input
              type="range"
              min={SURGE_MIN_RADIUS_MI}
              max={SURGE_MAX_RADIUS_MI}
              step={0.5}
              value={radiusMiles}
              onChange={(e) => emitRadius(Number(e.target.value))}
              className="min-w-[180px] flex-1 accent-brand-500"
            />
            <span className="text-xs text-gray-400">
              {SURGE_MIN_RADIUS_MI}–{SURGE_MAX_RADIUS_MI} mi
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Radius: <strong>{radiusMiles.toFixed(1)} mi</strong>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            Latitude
            <FieldHelpTip text="Center point latitude (auto-filled from map or search). Sent to the API as the zone center." />
          </span>
          <div className="mt-0.5 font-mono text-sm text-gray-800 dark:text-white/90">
            {lat.toFixed(7)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            Longitude
            <FieldHelpTip text="Center point longitude (auto-filled from map or search). Sent to the API as the zone center." />
          </span>
          <div className="mt-0.5 font-mono text-sm text-gray-800 dark:text-white/90">
            {lng.toFixed(7)}
          </div>
        </div>
      </div>
    </div>
  );
}
