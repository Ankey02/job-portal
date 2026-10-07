import type { Job } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatSalary(job: Pick<Job, "salary_min" | "salary_max">): string {
  const { salary_min: min, salary_max: max } = job;
  if (min && max) return `${inr.format(min)} – ${inr.format(max)} / year`;
  if (min) return `From ${inr.format(min)} / year`;
  if (max) return `Up to ${inr.format(max)} / year`;
  return "Salary not disclosed";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

/** Tailwind classes for a match score: green for strong, amber for medium, red for weak. */
export function scoreColor(score: number): { text: string; bar: string; badge: string } {
  if (score >= 70) {
    return { text: "text-emerald-700", bar: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  }
  if (score >= 40) {
    return { text: "text-amber-700", bar: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  return { text: "text-red-700", bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" };
}
