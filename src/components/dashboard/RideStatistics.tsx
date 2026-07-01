import StatColorCard from "./StatColorCard";

type RideStats = {
  total_rides?: number;
  cancelled_rides?: number;
  running_rides?: number;
  completed_rides?: number;
  pending_rides?: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

const RideIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const CancelIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

const RunningIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
  </svg>
);

const DoneIcon = () => (
  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export default function RideStatistics({ data }: { data?: RideStats | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg text-gray-500">▤</span>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ride Statistics
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatColorCard
          tone="teal"
          label="Total No of Ride"
          value={fmt(data?.total_rides ?? 0)}
          icon={<RideIcon />}
          to="/orders/orders"
        />
        <StatColorCard
          tone="red"
          label="Cancelled Ride"
          value={fmt(data?.cancelled_rides ?? 0)}
          icon={<CancelIcon />}
          to="/orders/orders?filter=cancelled"
        />
        <StatColorCard
          tone="orange"
          label="Running Ride"
          value={fmt(data?.running_rides ?? 0)}
          icon={<RunningIcon />}
          to="/orders/orders?filter=running"
        />
        <StatColorCard
          tone="green"
          label="Completed Ride"
          value={fmt(data?.completed_rides ?? 0)}
          icon={<DoneIcon />}
          to="/orders/orders?filter=completed"
        />
      </div>
    </div>
  );
}
