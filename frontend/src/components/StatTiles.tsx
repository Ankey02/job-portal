import { STATUSES } from "../types";
import type { ApplicationStatus } from "../types";

export interface Stat {
  label: string;
  value: number;
}

export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const BAR_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-sky-500",
  shortlisted: "bg-amber-500",
  rejected: "bg-red-500",
  hired: "bg-emerald-600",
};

/** A simple chart: one horizontal bar per status, built with plain CSS widths. */
export function StatusChart({ statuses }: { statuses: ApplicationStatus[] }) {
  const total = statuses.length;
  if (total === 0) return null;

  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Applications by status</h2>
      <ul className="space-y-2">
        {STATUSES.map((status) => {
          const count = statuses.filter((s) => s === status).length;
          const percent = Math.round((count / total) * 100);
          return (
            <li key={status} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="capitalize text-slate-600">{status}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={`block h-full rounded-full ${BAR_COLORS[status]}`}
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="text-right font-medium text-slate-900">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
