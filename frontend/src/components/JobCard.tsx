import { Link } from "react-router-dom";
import { JOB_TYPE_LABELS } from "../types";
import type { Job } from "../types";
import { formatDate, formatSalary } from "../utils";

export default function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="card block transition hover:border-emerald-600 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{job.title}</h2>
          <p className="text-sm text-slate-600">
            {job.company} · {job.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
          {JOB_TYPE_LABELS[job.job_type]}
        </span>
      </div>

      {job.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => (
            <li key={skill} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {skill}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatSalary(job)}</span>
        <span>Posted {formatDate(job.created_at)}</span>
      </div>
    </Link>
  );
}
