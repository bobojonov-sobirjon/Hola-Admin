import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";

type Cashout = {
  id: number;
  driver_id?: number;
  driver_name?: string;
  driver_email?: string;
  amount?: number | string;
  payment_type?: string;
  status: "pending" | "completed" | "failed" | string;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
};

type ApiListEnvelope<T> = { data?: T[]; count?: number };

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <Badge size="sm" color="success">completed</Badge>;
  if (s === "failed") return <Badge size="sm" color="error">failed</Badge>;
  return <Badge size="sm" color="warning">{s || "-"}</Badge>;
}

export default function CashoutsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Cashout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<"" | "pending" | "completed" | "failed">("");
  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("");

  const query = useMemo(
    () =>
      qs({
        status: status || undefined,
        driver_id: driverId ? Number(driverId) : undefined,
        driver_name: driverName.trim() ? driverName.trim() : undefined,
      }),
    [status, driverId, driverName]
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<ApiListEnvelope<Cashout>>(
        `admin-panel/driver-cashouts/${query}`,
        { headers: getAuthHeaders() }
      );
      setItems(res.data ?? []);
    } catch (e) {
      setError(getErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageMeta title="Cash outs" description="Cash outs" />
      <PageBreadcrumb pageTitle="Cash outs" />

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-[200px]">
            <Label>Status</Label>
            <Select
              options={[
                { value: "", label: "all" },
                { value: "pending", label: "pending" },
                { value: "completed", label: "completed" },
                { value: "failed", label: "failed" },
              ]}
              defaultValue={status}
              onChange={(v) => setStatus(v as any)}
            />
          </div>

          <div className="w-[200px]">
            <Label>Driver ID</Label>
            <Input
              type="number"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>

          <div className="w-[260px]">
            <Label>Driver name</Label>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="search by name/email"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setStatus("");
                setDriverId("");
                setDriverName("");
              }}
            >
              Reset
            </Button>
            <Button size="sm" disabled={loading} onClick={() => void load()}>
              {loading ? "Loading..." : "Apply"}
            </Button>
          </div>
        </div>
      </div>

      <ComponentCard title={`Cash outs (${items.length})`} desc="">
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
                      Driver
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Amount
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Payment type
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Created
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {items.map((it, idx) => (
                    <TableRow
                      key={it.id ?? idx}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      onClick={() => {
                        if (!it.id) return;
                        navigate(`/withdrawal/cash-outs/${it.id}`);
                      }}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {it.driver_name || it.driver_email || (it.driver_id ? `Driver #${it.driver_id}` : "-")}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {it.driver_id ? `ID: ${it.driver_id}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.amount ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {(it.payment_type as string) || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        {statusBadge(it.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {it.created_at ? new Date(it.created_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No cash outs.
                      </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
                      <TableCell className="px-4 py-3"> </TableCell>
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

