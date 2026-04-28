import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type Point = { x: string; y: number };

function formatX(x: string, interval: "day" | "month") {
  try {
    if (interval === "month") {
      // backend sends YYYY-MM
      const d = new Date(`${x}-01T00:00:00Z`);
      return new Intl.DateTimeFormat("en", { month: "short" }).format(d);
    }
    // day: YYYY-MM-DD
    const d = new Date(`${x}T00:00:00Z`);
    return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(d);
  } catch {
    return x;
  }
}

export default function MonthlySalesChart({
  points,
  interval,
}: {
  points: Point[];
  interval: "day" | "month";
}) {
  const categories = points.map((p) => formatX(p.x, interval));
  const data = points.map((p) => p.y);
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: interval === "day" ? "Orders (daily)" : "Orders (monthly)",
      data,
    },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Orders
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
