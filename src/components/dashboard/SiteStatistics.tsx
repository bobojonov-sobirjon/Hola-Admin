import StatColorCard from "./StatColorCard";

type SiteStats = {
  total_riders?: number;
  total_drivers?: number;
  vehicle_types?: number;
  revenue?: {
    amount?: number;
    currency?: string;
    from_completed_rides?: number;
  };
};

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function money(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return `$ ${fmt(amount)}`;
  }
}

const UserIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const DriverIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const CarIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 11l1.5-4.5h11L19 11H5zm14.08 1H4.92l.5 1.5h13.16l.5-1.5zM6.5 16a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
  </svg>
);

export default function SiteStatistics({ data }: { data?: SiteStats | null }) {
  const rev = data?.revenue;
  const amount = Number(rev?.amount ?? 0);
  const currency = rev?.currency || "USD";
  const fromRides = rev?.from_completed_rides ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg text-gray-500">▦</span>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Site Statistics
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatColorCard
          tone="teal"
          label="Total Riders"
          value={fmt(data?.total_riders ?? 0)}
          icon={<UserIcon />}
          to="/accounts/riders"
        />
        <StatColorCard
          tone="red"
          label="Total Drivers"
          value={fmt(data?.total_drivers ?? 0)}
          icon={<DriverIcon />}
          to="/accounts/drivers"
        />
        <StatColorCard
          tone="orange"
          label="Vehicle Type"
          value={fmt(data?.vehicle_types ?? 0)}
          icon={<CarIcon />}
          to="/vehicle-types"
        />
        <StatColorCard
          tone="green"
          label="Revenue"
          value={money(amount, currency)}
          subtext={fromRides ? `from ${fromRides} rides` : undefined}
          icon={<MoneyIcon />}
          to="/orders/orders?filter=completed"
        />
      </div>
    </div>
  );
}
