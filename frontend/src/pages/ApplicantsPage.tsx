import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchApplicants, fetchJob, updateApplicationStatus } from "../api/jobs";
import StatusBadge from "../components/StatusBadge";
import { STATUSES } from "../types";
import type { ApplicationStatus } from "../types";
import { errorMessage, formatDate, scoreColor } from "../utils";

const ACTIONS: { status: ApplicationStatus; label: string }[] = [
  { status: "shortlisted", label: "Shortlist" },
  { status: "hired", label: "Hire" },
  { status: "rejected", label: "Reject" },
];

export default function ApplicantsPage() {
  const jobId = Number(useParams().id);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  const jobQuery = useQuery({ queryKey: ["job", jobId], queryFn: () => fetchJob(jobId) });
  const applicantsQuery = useQuery({
    queryKey: ["applicants", jobId],
    queryFn: () => fetchApplicants(jobId),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: number; status: ApplicationStatus }) =>
      updateApplicationStatus(vars.id, vars.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applicants", jobId] }),
  });

  if (applicantsQuery.isPending) return <p className="text-sm text-slate-500">Loading applicants…</p>;
  if (applicantsQuery.isError) {
    return (
      <div>
        <p className="error-box mb-4">{errorMessage(applicantsQuery.error)}</p>
        <Link to="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const applicants = applicantsQuery.data;
  const visible = filter === "all" ? applicants : applicants.filter((a) => a.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <Link to="/dashboard" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Applicants{jobQuery.data ? ` for ${jobQuery.data.title}` : ""}
        </h1>
        <p className="text-sm text-slate-600">
          {applicants.length} {applicants.length === 1 ? "person has" : "people have"} applied.
          Sorted by resume match, best first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((value) => {
          const count =
            value === "all" ? applicants.length : applicants.filter((a) => a.status === value).length;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium capitalize transition ${
                filter === value
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {value} ({count})
            </button>
          );
        })}
      </div>

      {statusMutation.isError && <p className="error-box">{errorMessage(statusMutation.error)}</p>}

      {visible.length === 0 ? (
        <div className="card text-center text-sm text-slate-600">
          {applicants.length === 0 ? "No one has applied yet." : "No applicants with this status."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((application) => (
            <li key={application.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{application.candidate.full_name}</p>
                  <a
                    href={`mailto:${application.candidate.email}`}
                    className="text-sm text-emerald-700 hover:underline"
                  >
                    {application.candidate.email}
                  </a>
                  <p className="mt-1 text-xs text-slate-500">
                    Applied on {formatDate(application.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {application.match_score === null ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      No resume
                    </span>
                  ) : (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${scoreColor(application.match_score).badge}`}
                    >
                      {application.match_score}% match
                    </span>
                  )}
                  <StatusBadge status={application.status} />
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {application.cover_letter || "No cover letter."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIONS.filter((action) => action.status !== application.status).map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className={
                      action.status === "rejected"
                        ? "btn-outline px-3 py-1.5 text-red-700 hover:bg-red-50"
                        : "btn-outline px-3 py-1.5"
                    }
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: application.id, status: action.status })}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
