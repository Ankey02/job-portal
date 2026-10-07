import type { ApplicationStatus } from "../types";

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-sky-50 text-sky-800 border-sky-200",
  shortlisted: "bg-amber-50 text-amber-800 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hired: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
