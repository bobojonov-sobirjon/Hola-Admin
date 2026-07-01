import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import SiteStatistics from "../../components/dashboard/SiteStatistics";
import RideStatistics from "../../components/dashboard/RideStatistics";
import RideStatusChart from "../../components/dashboard/RideStatusChart";
import DriverStatisticsChart from "../../components/dashboard/DriverStatisticsChart";
import RecentRides from "../../components/dashboard/RecentRides";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import { getAuthHeaders, getErrorMessage, getJson } from "../../config/api";

type AnalyticsResponse = {
  filters: { date_from?: string | null; date_to?: string | null; interval: "day" | "month" };
  monthly_target: {
    target?: number;
    revenue_target: number;
    revenue_current_month: number;
    progress_percent: number;
  };
  site_statistics?: {
    total_riders?: number;
    total_drivers?: number;
    vehicle_types?: number;
    revenue?: { amount?: number; currency?: string; from_completed_rides?: number };
  };
  ride_statistics?: {
    total_rides?: number;
    cancelled_rides?: number;
    running_rides?: number;
    completed_rides?: number;
    pending_rides?: number;
  };
  ride_status_chart?: { x: string; label?: string; cancelled: number; completed: number }[];
  driver_statistics?: {
    total_drivers?: number;
    approved_drivers?: number;
    pending_drivers?: number;
    breakdown?: { key: string; label: string; count: number }[];
  };
  recent_rides?: {
    ride_id?: string;
    order_id: number;
    order_code?: string;
    rider_name?: string;
    driver_name?: string;
    pickup_address?: string;
    dropoff_address?: string;
    created_at?: string;
    ride_fare?: number;
    currency?: string;
    status?: string;
    status_label?: string;
    action?: string;
  }[];
};

function qs(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function Home() {
  const [interval, setInterval] = useState<"day" | "month">("month");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [recentLimit, setRecentLimit] = useState<string>("10");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const query = useMemo(
    () =>
      qs({
        interval,
        date_from: dateFrom && isIsoDate(dateFrom) ? dateFrom : undefined,
        date_to: dateTo && isIsoDate(dateTo) ? dateTo : undefined,
        recent_limit: recentLimit ? Math.min(50, Math.max(1, Number(recentLimit))) : undefined,
      }),
    [interval, dateFrom, dateTo, recentLimit]
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await getJson<{ data: AnalyticsResponse }>(
        `admin-panel/analytics/dashboard/${query}`,
        { headers: getAuthHeaders() }
      );
      setData(res.data ?? null);
    } catch (e) {
      setError(getErrorMessage(e));
      setData(null);
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
      <PageMeta title="Dashboard" description="Dashboard" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-[180px]">
            <Label>Interval</Label>
            <Select
              options={[
                { value: "month", label: "month" },
                { value: "day", label: "day" },
              ]}
              defaultValue={interval}
              onChange={(v) => setInterval(v as "day" | "month")}
            />
          </div>
          <div className="w-[200px]">
            <Label>Date from</Label>
            <DatePicker
              key={`from-${resetKey}`}
              id="analytics_date_from"
              label={undefined}
              placeholder="YYYY-MM-DD"
              defaultDate={dateFrom && isIsoDate(dateFrom) ? dateFrom : undefined}
              onChange={(_, dateStr) => setDateFrom(dateStr)}
            />
          </div>
          <div className="w-[200px]">
            <Label>Date to</Label>
            <DatePicker
              key={`to-${resetKey}`}
              id="analytics_date_to"
              label={undefined}
              placeholder="YYYY-MM-DD"
              defaultDate={dateTo && isIsoDate(dateTo) ? dateTo : undefined}
              onChange={(_, dateStr) => setDateTo(dateStr)}
            />
          </div>
          <div className="w-[180px]">
            <Label>Recent limit</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={recentLimit}
              onChange={(e) => setRecentLimit(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setInterval("month");
                setRecentLimit("10");
                setResetKey((k) => k + 1);
              }}
            >
              Reset
            </Button>
            <Button size="sm" disabled={loading} onClick={() => void load()}>
              {loading ? "Loading..." : "Apply"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-950/30 dark:text-error-300">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-6">
          <SiteStatistics data={data?.site_statistics} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <RideStatistics data={data?.ride_statistics} />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <MonthlyTarget target={data?.monthly_target} />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <RideStatusChart points={data?.ride_status_chart ?? []} />
        </div>

        <div className="col-span-12">
          <DriverStatisticsChart data={data?.driver_statistics} />
        </div>

        <div className="col-span-12">
          <RecentRides rows={data?.recent_rides ?? []} />
        </div>
      </div>
    </>
  );
}
