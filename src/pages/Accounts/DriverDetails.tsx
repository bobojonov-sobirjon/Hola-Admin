import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { useModal } from "../../hooks/useModal";
import { deleteJson, getAuthHeaders, getErrorMessage, getJson } from "../../config/api";
import DriverLastLocationMap from "../../components/drivers/DriverLastLocationMap";
import {
  getDriverOnlineInfo,
  type DriverCurrentLocation,
  type OnlineStatus,
} from "../../utils/driverAvailability";

type DeviceToken = {
  id: number;
  mobile: string;
  token: string;
  created_at: string;
  updated_at: string;
};

type AgreementItem = {
  id: number;
  title: string;
  is_accepted: boolean;
  created_at?: string;
  updated_at?: string;
  file_url: string | null;
};

type AgreementBlock = {
  total: number;
  accepted: number;
  items: AgreementItem[];
};

type DriverVerification = {
  status: string;
  status_display?: string;
  comment?: string | null;
  estimated_review_hours?: number | null;
  reviewed_at?: string | null;
  reviewer?: string | null;
};

type Vehicle = {
  brand: string;
  model: string;
  year_of_manufacture: number;
  vin: string;
  plate_number: string;
  color: string;
  vehicle_condition: string;
  default_ride_type: string;
  supported_ride_types: string[];
  images: string[];
};

type DriverPreferences = Record<string, unknown> | null;

type Driver = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  address: string;
  tax_number: string | null;
  avatar: string | null;
  id_identification: string;
  is_verified: boolean;
  is_active: boolean;
  is_online?: boolean;
  online_status?: OnlineStatus | null;
  current_location?: DriverCurrentLocation | null;
  created_at: string;
  updated_at: string;
  verification_activation?: string;
  driver_verification?: DriverVerification | null;
  groups: string[] | null;
  driver_preferences?: DriverPreferences;
  vehicle?: Vehicle | null;
  upload_identifications?: AgreementBlock;
  legal_agreements?: AgreementBlock;
  registration_agreements?: AgreementBlock;
  terms_acceptance?: AgreementBlock;
  device_tokens?: DeviceToken[];
};

type DriverDetailsResponse = {
  status?: string;
  message?: string;
  data?: Driver;
};

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<DriverDetailsResponse>(
        `admin-panel/drivers/${id}/`,
        { headers: getAuthHeaders() }
      );
      setItem(res.data ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function confirmDelete() {
    if (!id || !item) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteJson<unknown>(`admin-panel/drivers/${id}/`, {
        headers: getAuthHeaders(),
      });
      closeModal();
      navigate("/accounts/drivers");
    } catch (e) {
      closeModal();
      setError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const avatarUrl = useMemo(() => {
    if (!item?.avatar) return "/images/user/owner.jpg";
    const v = item.updated_at ?? Date.now().toString();
    return item.avatar.includes("?")
      ? `${item.avatar}&v=${encodeURIComponent(v)}`
      : `${item.avatar}?v=${encodeURIComponent(v)}`;
  }, [item?.avatar, item?.updated_at]);

  const online = useMemo(
    () => (item ? getDriverOnlineInfo(item) : { isOnline: false, label: "Offline" }),
    [item]
  );

  return (
    <>
      <PageMeta title="Driver Details" description="Driver details" />
      <PageBreadcrumb pageTitle="Driver Details" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/accounts/drivers"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to Drivers
        </Link>
        {item ? (
          <Button
            size="sm"
            className="ml-auto !bg-error-500 !text-white hover:!bg-error-600 disabled:!bg-error-300 !ring-0"
            disabled={deleting}
            onClick={openModal}
          >
            Delete driver
          </Button>
        ) : null}
      </div>

      <DeleteConfirmModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirm={() => void confirmDelete()}
        deleting={deleting}
        entityLabel="driver"
        displayName={item?.full_name || item?.email || undefined}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : item ? (
        <div className="space-y-6">
          <ComponentCard title="Driver">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                  <img
                    src={avatarUrl}
                    alt={item.full_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {item.full_name || item.username || item.email}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.email}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge size="sm" color={item.is_verified ? "success" : "warning"}>
                  {item.is_verified ? "Verified" : "Not verified"}
                </Badge>
                <Badge size="sm" color={item.is_active ? "success" : "error"}>
                  {item.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  size="sm"
                  variant="solid"
                  color={online.isOnline ? "success" : "light"}
                >
                  {online.label}
                </Badge>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Driver availability" desc="Online status from driver app">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Info label="Availability" value={online.label} />
              <Info label="Is online" value={online.isOnline ? "Yes" : "No"} />
              <Info
                label="Status"
                value={item.online_status?.status || (online.isOnline ? "online" : "offline")}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="Driver Verification">
            {item.driver_verification ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info label="Status" value={item.driver_verification.status_display || item.driver_verification.status} />
                <Info
                  label="Activation"
                  value={item.verification_activation || "-"}
                />
                <Info label="Comment" value={(item.driver_verification.comment as string) || "-"} />
                <Info
                  label="Estimated review (hours)"
                  value={
                    item.driver_verification.estimated_review_hours !== null &&
                    item.driver_verification.estimated_review_hours !== undefined
                      ? String(item.driver_verification.estimated_review_hours)
                      : "-"
                  }
                />
                <Info
                  label="Reviewed at"
                  value={
                    item.driver_verification.reviewed_at
                      ? new Date(item.driver_verification.reviewed_at).toLocaleString()
                      : "-"
                  }
                />
                <Info label="Reviewer" value={item.driver_verification.reviewer || "-"} />
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No verification data.
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Personal Information">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="ID" value={String(item.id)} />
              <Info label="Username" value={item.username || "-"} />
              <Info label="First Name" value={item.first_name || "-"} />
              <Info label="Last Name" value={item.last_name || "-"} />
              <Info label="Phone" value={item.phone_number || "-"} />
              <Info label="Date of birth" value={item.date_of_birth || "-"} />
              <Info label="Address" value={item.address || "-"} />
              <Info label="Tax number" value={item.tax_number || "-"} />
              <Info label="ID identification" value={item.id_identification || "-"} />
              <Info
                label="Groups"
                value={Array.isArray(item.groups) ? item.groups.join(", ") : "-"}
              />
              <Info
                label="Created at"
                value={item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
              />
              <Info
                label="Updated at"
                value={item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="Vehicle">
            {item.vehicle ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Info label="Brand" value={item.vehicle.brand || "-"} />
                  <Info label="Model" value={item.vehicle.model || "-"} />
                  <Info label="Year" value={String(item.vehicle.year_of_manufacture ?? "-")} />
                  <Info label="VIN" value={item.vehicle.vin || "-"} />
                  <Info label="Plate number" value={item.vehicle.plate_number || "-"} />
                  <Info label="Color" value={item.vehicle.color || "-"} />
                  <Info label="Condition" value={item.vehicle.vehicle_condition || "-"} />
                  <Info label="Default ride type" value={item.vehicle.default_ride_type || "-"} />
                  <Info
                    label="Supported ride types"
                    value={
                      item.vehicle.supported_ride_types?.length
                        ? item.vehicle.supported_ride_types.join(", ")
                        : "-"
                    }
                  />
                </div>
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Images
                  </div>
                  {item.vehicle.images?.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {item.vehicle.images.map((src, idx) => (
                        <a
                          key={idx}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
                        >
                          <img
                            src={src}
                            alt={`Vehicle ${idx + 1}`}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No images.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No vehicle data.
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Driver Preferences">
            {item.driver_preferences ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(item.driver_preferences)
                  .filter(([, v]) => v !== null && v !== undefined)
                  .map(([k, v]) => (
                    <Info
                      key={k}
                      label={prettyKey(k)}
                      value={formatPrefValue(v)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No preferences.
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="Agreements & Identifications">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Block label="Upload identifications" block={item.upload_identifications} />
              <Block label="Legal agreements" block={item.legal_agreements} />
              <Block label="Registration agreements" block={item.registration_agreements} />
              <Block label="Terms acceptance" block={item.terms_acceptance} />
            </div>
          </ComponentCard>

          <ComponentCard title="Device Tokens">
            {item.device_tokens?.length ? (
              <div className="space-y-3">
                {item.device_tokens.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {t.mobile}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t.created_at ? new Date(t.created_at).toLocaleString() : "-"}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                      {t.token}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No device tokens.
              </div>
            )}
          </ComponentCard>

          <DriverLastLocationMap
            location={item.current_location}
            driverName={item.full_name || item.username}
          />
        </div>
      ) : null}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </div>
    </div>
  );
}

function prettyKey(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatPrefValue(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.trim() ? v : "-";
  if (Array.isArray(v)) {
    const flat = v.map((x) => (x === null || x === undefined ? "" : String(x))).filter(Boolean);
    return flat.length ? flat.join(", ") : "-";
  }
  if (typeof v === "object") {
    try {
      const entries: string[] = Object.entries(v as Record<string, unknown>)
        .filter(([, vv]) => vv !== null && vv !== undefined)
        .slice(0, 6)
        .map(([kk, vv]) => `${prettyKey(kk)}: ${formatPrefValue(vv)}`);
      return entries.length ? entries.join(" • ") : "-";
    } catch {
      return "-";
    }
  }
  return String(v);
}

function Block({ label, block }: { label: string; block?: AgreementBlock }) {
  const summary = block ? `${block.accepted}/${block.total} accepted` : "-";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{summary}</div>
      </div>
      {block?.items?.length ? (
        <div className="mt-3 space-y-2">
          {block.items.map((it) => (
            <div
              key={it.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm text-gray-800 dark:text-white/90">
                  {it.title}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {(it.updated_at || it.created_at)
                    ? new Date(it.updated_at || it.created_at || "").toLocaleString()
                    : "-"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="sm" color={it.is_accepted ? "success" : "warning"}>
                  {it.is_accepted ? "Accepted" : "Not accepted"}
                </Badge>
                {it.file_url ? (
                  <a
                    href={it.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    View file
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No file
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No items.
        </div>
      )}
    </div>
  );
}

