import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import TextArea from "../../components/form/input/TextArea";
import {
  deleteJson,
  getAuthHeaders,
  getErrorMessage,
  getJson,
  patchJson,
} from "../../config/api";
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

type VerificationStatus = "approved" | "rejected" | "in_review" | "not_submitted";

type DriverVerificationPayload = {
  status?: string;
  status_display?: string;
  comment?: string | null;
  estimated_review_hours?: number | null;
  reviewed_at?: string | null;
  reviewer?: string | null;
  readiness?: Record<string, unknown> | null;
  identification_ready?: boolean;
  registration_ready?: boolean;
  is_ready?: boolean;
  upload_identifications?: AgreementBlock;
  legal_agreements?: AgreementBlock;
  registration_agreements?: AgreementBlock;
  terms_acceptance?: AgreementBlock;
  driver_verification?: DriverVerification | null;
  [key: string]: unknown;
};

const VERIFICATION_STATUS_OPTIONS: {
  value: VerificationStatus;
  label: string;
  hint: string;
}[] = [
  { value: "approved", label: "Approve", hint: "Appda Identification ✅" },
  { value: "rejected", label: "Reject", hint: "Rad etish" },
  { value: "in_review", label: "In review", hint: "Ko‘rib chiqilmoqda" },
  { value: "not_submitted", label: "Reset", hint: "not_submitted" },
];

function verificationBadgeColor(
  status?: string | null
): "success" | "error" | "warning" | "info" | "light" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "in_review") return "warning";
  if (status === "not_submitted") return "light";
  return "info";
}

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

type VerificationDetailsResponse = {
  status?: string;
  message?: string;
  data?: DriverVerificationPayload;
};

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Driver | null>(null);
  const [verification, setVerification] = useState<DriverVerificationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("in_review");
  const [verificationComment, setVerificationComment] = useState("");
  const { isOpen, openModal, closeModal } = useModal(false);

  function applyVerificationPayload(data: DriverVerificationPayload | null) {
    setVerification(data);
    const status = (data?.status || data?.driver_verification?.status || "not_submitted") as string;
    const allowed = VERIFICATION_STATUS_OPTIONS.some((o) => o.value === status);
    setVerificationStatus((allowed ? status : "in_review") as VerificationStatus);
    setVerificationComment(
      String(data?.comment ?? data?.driver_verification?.comment ?? "")
    );
  }

  async function loadVerification(driverId: string) {
    setVerificationError(null);
    try {
      const res = await getJson<VerificationDetailsResponse>(
        `admin-panel/drivers/${driverId}/verification/`,
        { headers: getAuthHeaders() }
      );
      applyVerificationPayload(res.data ?? null);
    } catch (e) {
      setVerificationError(getErrorMessage(e));
      setVerification(null);
    }
  }

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
      await loadVerification(id);
    } catch (e) {
      setError(getErrorMessage(e));
      setItem(null);
      setVerification(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (loading || !item) return;
    if (window.location.hash !== "#verification") return;
    const el = document.getElementById("verification");
    if (!el) return;
    window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [loading, item]);

  async function saveVerification() {
    if (!id) return;
    setVerificationError(null);
    setSavingVerification(true);
    try {
      const res = await patchJson<VerificationDetailsResponse>(
        `admin-panel/drivers/${id}/verification/`,
        {
          status: verificationStatus,
          comment: verificationComment.trim(),
        },
        { headers: getAuthHeaders() }
      );
      if (res.data) {
        applyVerificationPayload(res.data);
      } else {
        await loadVerification(id);
      }
      // Refresh driver summary badges after status change.
      const driverRes = await getJson<DriverDetailsResponse>(
        `admin-panel/drivers/${id}/`,
        { headers: getAuthHeaders() }
      );
      setItem(driverRes.data ?? null);
    } catch (e) {
      setVerificationError(getErrorMessage(e));
    } finally {
      setSavingVerification(false);
    }
  }

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

          <ComponentCard
            id="verification"
            title="Driver Verification"
            desc="GET/PATCH admin-panel/drivers/{id}/verification/"
          >
            {verificationError ? (
              <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
                {verificationError}
              </div>
            ) : null}

            {(() => {
              const v = verification?.driver_verification || verification;
              const status = v?.status || item.driver_verification?.status;
              const statusDisplay =
                (v as DriverVerification | undefined)?.status_display ||
                item.driver_verification?.status_display ||
                status ||
                "-";
              const comment =
                (v as DriverVerification | undefined)?.comment ??
                item.driver_verification?.comment;
              const reviewedAt =
                (v as DriverVerification | undefined)?.reviewed_at ??
                item.driver_verification?.reviewed_at;
              const reviewer =
                (v as DriverVerification | undefined)?.reviewer ??
                item.driver_verification?.reviewer;
              const estimated =
                (v as DriverVerification | undefined)?.estimated_review_hours ??
                item.driver_verification?.estimated_review_hours;

              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                      <div className="mt-2">
                        <Badge size="sm" color={verificationBadgeColor(status)}>
                          {statusDisplay}
                        </Badge>
                      </div>
                    </div>
                    <Info
                      label="Activation"
                      value={item.verification_activation || "-"}
                    />
                    <Info label="Comment" value={(comment as string) || "-"} />
                    <Info
                      label="Estimated review (hours)"
                      value={
                        estimated !== null && estimated !== undefined
                          ? String(estimated)
                          : "-"
                      }
                    />
                    <Info
                      label="Reviewed at"
                      value={
                        reviewedAt ? new Date(String(reviewedAt)).toLocaleString() : "-"
                      }
                    />
                    <Info label="Reviewer" value={(reviewer as string) || "-"} />
                  </div>

                  <ReadinessPanel
                    readiness={verification?.readiness}
                    identificationReady={verification?.identification_ready}
                    registrationReady={verification?.registration_ready}
                    isReady={verification?.is_ready}
                  />

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                      Update verification status
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>Status</Label>
                        <select
                          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                          value={verificationStatus}
                          onChange={(e) =>
                            setVerificationStatus(e.target.value as VerificationStatus)
                          }
                        >
                          {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} — {opt.hint}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Comment</Label>
                        <TextArea
                          rows={4}
                          value={verificationComment}
                          onChange={setVerificationComment}
                          placeholder="e.g. OK"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          size="sm"
                          variant={verificationStatus === opt.value ? "primary" : "outline"}
                          disabled={savingVerification}
                          onClick={() => setVerificationStatus(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        className="ml-auto"
                        disabled={savingVerification}
                        onClick={() => void saveVerification()}
                      >
                        {savingVerification ? "Saving..." : "Save status"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </ComponentCard>

          <DriverLastLocationMap
            location={item.current_location}
            driverName={item.full_name || item.username}
          />

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

          <ComponentCard
            title="Agreements & Identifications"
            desc="Identification uploads, legal/registration terms and readiness"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Block
                label="Upload identifications"
                block={
                  verification?.upload_identifications || item.upload_identifications
                }
              />
              <Block
                label="Legal agreements"
                block={verification?.legal_agreements || item.legal_agreements}
              />
              <Block
                label="Registration agreements"
                block={
                  verification?.registration_agreements || item.registration_agreements
                }
              />
              <Block
                label="Terms acceptance"
                block={verification?.terms_acceptance || item.terms_acceptance}
              />
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function CheckValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <Badge size="sm" color={value ? "success" : "error"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (Array.isArray(value)) {
    const items = value
      .map((x) => (x === null || x === undefined ? "" : String(x)))
      .filter(Boolean);
    if (!items.length) return <span className="text-sm text-gray-500">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} size="sm" color="info">
            {prettyKey(item)}
          </Badge>
        ))}
      </div>
    );
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-gray-500 dark:text-gray-400">—</span>;
  }
  return (
    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
      {String(value)}
    </span>
  );
}

function ReadinessPanel({
  readiness,
  identificationReady,
  registrationReady,
  isReady,
}: {
  readiness?: Record<string, unknown> | null;
  identificationReady?: boolean;
  registrationReady?: boolean;
  isReady?: boolean;
}) {
  const r = readiness ?? {};
  const checks = asRecord(r.checks);
  const details = asRecord(r.details);
  const readyForRides = r.ready_for_rides;
  const completion = r.completion_percent ?? r.completionPercent;
  const extraFlags = [
    identificationReady != null
      ? { label: "Identification ready", value: identificationReady }
      : null,
    registrationReady != null
      ? { label: "Registration ready", value: registrationReady }
      : null,
    isReady != null ? { label: "Overall ready", value: isReady } : null,
  ].filter(Boolean) as { label: string; value: boolean }[];

  const hasAnything =
    extraFlags.length ||
    readyForRides != null ||
    completion != null ||
    checks ||
    details;
  if (!hasAnything) return null;

  const skipKeys = new Set(["checks", "details", "ready_for_rides", "completion_percent"]);
  const otherScalars = Object.entries(r).filter(
    ([k, v]) => !skipKeys.has(k) && v !== null && v !== undefined && !asRecord(v)
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {readyForRides != null ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-xs text-gray-500 dark:text-gray-400">Ready for rides</div>
            <div className="mt-2">
              <Badge size="sm" color={readyForRides ? "success" : "error"}>
                {readyForRides ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        ) : null}
        {completion != null ? (
          <Info label="Completion" value={`${completion}%`} />
        ) : null}
        {extraFlags.map((f) => (
          <div
            key={f.label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">{f.label}</div>
            <div className="mt-2">
              <Badge size="sm" color={f.value ? "success" : "warning"}>
                {f.value ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        ))}
        {otherScalars.map(([k, v]) => (
          <div
            key={k}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">{prettyKey(k)}</div>
            <div className="mt-2">
              <CheckValue value={v} />
            </div>
          </div>
        ))}
      </div>

      {checks ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Checks
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(checks).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-white/[0.06]"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {prettyKey(key)}
                </span>
                <CheckValue value={val} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {details ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Details
          </div>
          {typeof details.message === "string" && details.message.trim() ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
              {details.message}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Object.entries(details)
              .filter(([key]) => key !== "message")
              .map(([section, value]) => {
                const nested = asRecord(value);
                return (
                  <div
                    key={section}
                    className="rounded-xl border border-gray-100 p-3 dark:border-white/[0.06]"
                  >
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {prettyKey(section)}
                    </div>
                    {nested ? (
                      <div className="space-y-2">
                        {Object.entries(nested).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {prettyKey(k)}
                            </span>
                            <CheckValue value={v} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <CheckValue value={value} />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
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

