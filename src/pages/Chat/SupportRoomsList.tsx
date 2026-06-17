import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";

type SupportRoom = {
  id: number;
  user?: Record<string, unknown> | null;
  admin?: Record<string, unknown> | null;
  order_ids?: number[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: unknown;
};

type ListEnvelope<T> = {
  data?: T;
  status?: string;
  message?: string;
  [k: string]: unknown;
};

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function userLabel(user: Record<string, unknown> | null | undefined) {
  if (!user) return "-";
  const fullName = safeStr(user.full_name).trim();
  const email = safeStr(user.email).trim();
  const phone = safeStr(user.phone_number).trim();
  const main = fullName || email || phone || "-";
  const sub = email && email !== main ? email : phone && phone !== main ? phone : "";
  return sub ? `${main} — ${sub}` : main;
}

function sortByUpdatedDesc(a: SupportRoom, b: SupportRoom) {
  const ad = a.updated_at ? Date.parse(String(a.updated_at)) : 0;
  const bd = b.updated_at ? Date.parse(String(b.updated_at)) : 0;
  return (bd || 0) - (ad || 0);
}

export default function SupportRoomsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SupportRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ListEnvelope<SupportRoom[]>>("chat/support/rooms/", {
        headers: getAuthHeaders(),
      });
      const arr = Array.isArray(res?.data) ? res.data : [];
      setItems(arr);
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => [...items].sort(sortByUpdatedDesc), [items]);

  return (
    <>
      <PageMeta title="Support rooms" description="Support rooms" />
      <PageBreadcrumb pageTitle="Support rooms" />

      <ComponentCard title={`Rooms (${sorted.length})`} desc="">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      #
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      User
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Updated
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {sorted.map((it, idx) => (
                    <TableRow
                      key={it.id ?? idx}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() => it.id && navigate(`/chat/support/rooms/${it.id}`)}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="text-gray-800 text-theme-sm dark:text-white/90">
                          {userLabel(it.user as any)}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="text-gray-500 text-theme-sm dark:text-gray-400">
                          {it.updated_at ? new Date(String(it.updated_at)).toLocaleString() : "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!sorted.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No rooms.
                      </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
}

