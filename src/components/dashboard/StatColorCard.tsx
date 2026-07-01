import type { ReactNode } from "react";
import { Link } from "react-router";

type Props = {
  label: string;
  value: string;
  subtext?: string;
  tone: "teal" | "red" | "orange" | "green";
  icon: ReactNode;
  to?: string;
};

const tones = {
  teal: "bg-gradient-to-br from-cyan-600 to-teal-700",
  red: "bg-gradient-to-br from-rose-500 to-red-600",
  orange: "bg-gradient-to-br from-amber-500 to-orange-600",
  green: "bg-gradient-to-br from-emerald-500 to-green-600",
};

export default function StatColorCard({ label, value, subtext, tone, icon, to }: Props) {
  const content = (
    <div
      className={`relative overflow-hidden rounded-xl p-4 text-white shadow-md ${tones[tone]} min-h-[110px] ${
        to ? "transition hover:brightness-110 hover:shadow-lg cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="text-sm font-medium text-white/90">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
          {subtext ? (
            <div className="mt-1 text-xs text-white/80">{subtext}</div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500">
        {content}
      </Link>
    );
  }

  return content;
}
