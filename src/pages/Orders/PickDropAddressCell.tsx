function PinIcon({ tone }: { tone: "green" | "red" }) {
  const fill = tone === "green" ? "#16a34a" : "#dc2626";
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill={fill}
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      />
    </svg>
  );
}

export default function PickDropAddressCell({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="min-w-[220px] max-w-md space-y-2 text-theme-sm text-gray-600 dark:text-gray-300">
      <div className="flex items-start gap-2">
        <PinIcon tone="green" />
        <span className="leading-snug">{from}</span>
      </div>
      <div className="flex items-start gap-2">
        <PinIcon tone="red" />
        <span className="leading-snug">{to}</span>
      </div>
    </div>
  );
}
