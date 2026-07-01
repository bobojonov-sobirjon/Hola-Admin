import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type Point = {
  x: string;
  label?: string;
  cancelled: number;
  completed: number;
};

function formatLabel(p: Point) {
  if (p.label) return p.label;
  try {
    const d = new Date(`${p.x}-01T00:00:00Z`);
    return new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  } catch {
    return p.x;
  }
}

export default function RideStatusChart({ points }: { points: Point[] }) {
  const categories = points.map(formatLabel);
  const completed = points.map((p) => p.completed ?? 0);
  const cancelled = points.map((p) => p.cancelled ?? 0);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#2563eb", "#9ca3af"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0.15,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
    },
    grid: {
      borderColor: "#f1f5f9",
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const series = [
    { name: "completed", data: completed },
    { name: "cancelled", data: cancelled },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg text-gray-500">⌁</span>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ride Status
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[520px]">
          <Chart options={options} series={series} type="area" height={320} />
        </div>
      </div>
    </div>
  );
}
