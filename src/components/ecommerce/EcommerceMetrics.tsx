import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

type Kpi = { current: number; previous: number; change_percent: number };

function num(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(v: number) {
  return new Intl.NumberFormat().format(v);
}

export default function EcommerceMetrics({
  kpis,
}: {
  kpis?:
    | {
        riders_added: Kpi;
        drivers_added: Kpi;
        orders_created: Kpi;
        orders_completed: Kpi;
        revenue: Kpi;
      }
    | null;
}) {
  const items = [
    {
      label: "Riders added",
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      kpi: kpis?.riders_added,
    },
    {
      label: "Drivers added",
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      kpi: kpis?.drivers_added,
    },
    {
      label: "Orders created",
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      kpi: kpis?.orders_created,
    },
    {
      label: "Orders completed",
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      kpi: kpis?.orders_completed,
    },
    {
      label: "Revenue",
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      kpi: kpis?.revenue,
      money: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {items.map((it) => {
        const cp = num(it.kpi?.change_percent);
        const up = cp >= 0;
        const color = up ? "success" : "error";
        const current = num(it.kpi?.current);
        return (
          <div
            key={it.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              {it.icon}
            </div>

            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {it.label}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {it.money ? `$${fmt(current)}` : fmt(current)}
                </h4>
              </div>
              <Badge color={color}>
                {up ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(cp).toFixed(2)}%
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
