import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useEffect, useState } from "react";
import { getErrorMessage, getJson, getAuthHeaders } from "../config/api";

export type Me = {
  id?: string | number;
  email?: string;
  username?: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  avatar?: string;
  address?: string;
  longitude?: string | number | null;
  latitude?: string | number | null;
  tax_number?: string;
  id_identification?: string;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  [key: string]: unknown;
};

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
};

export default function UserProfiles() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMe() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiEnvelope<Me> | Me>("accounts/me/", {
        headers: getAuthHeaders(),
      });
      const next = (res as ApiEnvelope<Me>)?.data ?? (res as Me);
      setMe(next ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <>
      <PageMeta
        title="Profile"
        description="Profile"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Loading profile...
          </div>
        )}
        <div className="space-y-6">
          <UserMetaCard me={me} onUpdated={loadMe} />
          <UserInfoCard me={me} onUpdated={loadMe} />
          <UserAddressCard me={me} onUpdated={loadMe} />
        </div>
      </div>
    </>
  );
}
