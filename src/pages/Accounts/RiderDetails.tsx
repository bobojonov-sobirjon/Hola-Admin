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

type RiderDeviceToken = {
  id: number;
  mobile: string;
  token: string;
  created_at: string;
  updated_at: string;
};

type RegistrationAgreementItem = {
  id: number;
  title: string;
  is_accepted: boolean;
  updated_at: string;
  file_url: string | null;
};

type RiderPreferences = {
  chatting_preference?: string;
  temperature_preference?: string;
  music_preference?: string;
  volume_level?: string;
  [key: string]: unknown;
};

type Rider = {
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
  created_at: string;
  updated_at: string;
  groups: string[] | null;
  rider_preferences?: RiderPreferences | null;
  pin_verification?: unknown | null;
  invitation_users?: { total: number; active: number; items?: unknown[] };
  registration_agreements?: {
    total: number;
    accepted: number;
    items?: RegistrationAgreementItem[];
  };
  device_tokens?: RiderDeviceToken[];
};

type RiderDetailsResponse = {
  status?: string;
  message?: string;
  data?: Rider;
};

export default function RiderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isOpen, openModal, closeModal } = useModal(false);

  async function load() {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<RiderDetailsResponse>(
        `admin-panel/riders/${id}/`,
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
      await deleteJson<unknown>(`admin-panel/riders/${id}/`, {
        headers: getAuthHeaders(),
      });
      closeModal();
      navigate("/accounts/riders");
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

  return (
    <>
      <PageMeta title="Rider Details" description="Rider details" />
      <PageBreadcrumb pageTitle="Rider Details" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/accounts/riders"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          ← Back to Riders
        </Link>
        {item ? (
          <Button
            size="sm"
            className="ml-auto !bg-error-500 !text-white hover:!bg-error-600 disabled:!bg-error-300 !ring-0"
            disabled={deleting}
            onClick={openModal}
          >
            Delete rider
          </Button>
        ) : null}
      </div>

      <DeleteConfirmModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirm={() => void confirmDelete()}
        deleting={deleting}
        entityLabel="rider"
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
          <ComponentCard title="Rider">
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
              </div>
            </div>
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

          <ComponentCard title="Related">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Info
                label="Invitation users"
                value={
                  item.invitation_users
                    ? `${item.invitation_users.active}/${item.invitation_users.total}`
                    : "-"
                }
              />
              <Info
                label="Registration agreements"
                value={
                  item.registration_agreements
                    ? `${item.registration_agreements.accepted}/${item.registration_agreements.total}`
                    : "-"
                }
              />
              <Info
                label="Device tokens"
                value={String(item.device_tokens?.length ?? 0)}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="Rider Preferences">
            {item.rider_preferences ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info
                  label="Chatting"
                  value={(item.rider_preferences.chatting_preference as string) || "-"}
                />
                <Info
                  label="Temperature"
                  value={(item.rider_preferences.temperature_preference as string) || "-"}
                />
                <Info
                  label="Music"
                  value={(item.rider_preferences.music_preference as string) || "-"}
                />
                <Info
                  label="Volume"
                  value={(item.rider_preferences.volume_level as string) || "-"}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No preferences.
              </div>
            )}
          </ComponentCard>

          <ComponentCard title="PIN Verification">
            {item.pin_verification ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info label="PIN" value={extractPin(item.pin_verification)} />
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No pin verification.
              </div>
            )}
          </ComponentCard>

          <ComponentCard
            title="Registration Agreements"
            desc={
              item.registration_agreements
                ? `${item.registration_agreements.accepted}/${item.registration_agreements.total} accepted`
                : ""
            }
          >
            {item.registration_agreements?.items?.length ? (
              <div className="space-y-3">
                {item.registration_agreements.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {it.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Updated:{" "}
                        {it.updated_at
                          ? new Date(it.updated_at).toLocaleString()
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
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No registration agreements.
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

function extractPin(v: unknown) {
  if (!v) return "-";
  if (typeof v === "string") return v.trim() || "-";
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && !Array.isArray(v)) {
    const pin = (v as any).pin;
    if (typeof pin === "string") return pin.trim() || "-";
    if (typeof pin === "number") return String(pin);
  }
  return "-";
}

