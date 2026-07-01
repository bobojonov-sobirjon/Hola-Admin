import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type BreakdownItem = {
  key: string;
  label: string;
  count: number;
};

type DriverStats = {
  total_drivers?: number;
  approved_drivers?: number;
  pending_drivers?: number;
  breakdown?: BreakdownItem[];
};

const COLORS = ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#cbd5e1", "#94a3b8"];

export default function DriverStatisticsChart({ data }: { data?: DriverStats | null }) {
  const breakdown = data?.breakdown ?? [];
  const [hover, setHover] = useState<{ label: string; count: number } | null>(null);

  const defaultCenter = useMemo(() => {
    const approved = breakdown.find((b) => b.key === "approved");
    return {
      label: approved?.label || "Approved Drivers",
      count: approved?.count ?? data?.approved_drivers ?? 0,
    };
  }, [breakdown, data?.approved_drivers]);

  const center = hover ?? defaultCenter;

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      events: {
        dataPointMouseEnter: (_e, _ctx, config) => {
          const idx = config.dataPointIndex;
          const item = breakdown[idx];
          if (item) setHover({ label: item.label, count: item.count });
        },
        dataPointMouseLeave: () => setHover(null),
      },
    },
    colors: COLORS.slice(0, breakdown.length || 1),
    labels: breakdown.map((b) => b.label),
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 4, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: { show: false },
        },
      },
    },
    tooltip: {
      y: { formatter: (v) => String(v) },
    },
  };

  const series = breakdown.map((b) => b.count);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg text-gray-500">▥</span>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Driver Statistics
        </h3>
      </div>
      <div className="relative mx-auto max-w-[340px]">
        {breakdown.length ? (
          <>
            <Chart options={options} series={series} type="donut" height={300} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
              <div className="max-w-[140px] text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                {center.label}
              </div>
              <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {center.count}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
            No driver data
          </div>
        )}
      </div>
    </div>
  );
}
