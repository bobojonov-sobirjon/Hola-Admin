import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type Point = { x: string; y: number };

function formatX(x: string, interval: "day" | "month") {
  try {
    if (interval === "month") {
      const d = new Date(`${x}-01T00:00:00Z`);
      // show month short, and year on January
      const m = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
      const y = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
      return d.getUTCMonth() === 0 ? `${m} ${y}` : m;
    }
    const d = new Date(`${x}T00:00:00Z`);
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(d);
  } catch {
    return x;
  }
}

export default function StatisticsChart({
  interval,
  orders,
  riders,
  drivers,
}: {
  interval: "day" | "month";
  orders: Point[];
  riders: Point[];
  drivers: Point[];
}) {
  const categories = orders.map((p) => formatX(p.x, interval));

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF", "#22C55E"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2, 2],
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: interval === "day" ? "yyyy-MM-dd" : "yyyy-MM",
      },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Orders",
      data: orders.map((p) => p.y),
    },
    {
      name: "Riders",
      data: riders.map((p) => p.y),
    },
    {
      name: "Drivers",
      data: drivers.map((p) => p.y),
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Orders, riders, and drivers over time
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
