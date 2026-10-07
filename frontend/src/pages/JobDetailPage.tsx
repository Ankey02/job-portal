import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { applyToJob, fetchJob, fetchMyApplications } from "../api/jobs";
import MatchCard from "../components/MatchCard";
import { STATUS_STYLES } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { JOB_TYPE_LABELS } from "../types";
import { errorMessage, formatDate, formatSalary } from "../utils";

export default function JobDetailPage() {
  const jobId = Number(useParams().id);
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
    enabled: Number.isInteger(jobId),
  });

  // Only candidates have applications, so only they need this request
  const isCandidate = user?.role === "candidate";
  const applicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: fetchMyApplications,
    enabled: isCandidate,
  });
  const myApplication = applicationsQuery.data?.find((a) => a.job_id === jobId);

  const applyMutation = useMutation({
    mutationFn: () => applyToJob(jobId, coverLetter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
  });

  function handleApply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    applyMutation.mutate();
  }

  if (!Number.isInteger(jobId)) return <p className="error-box">Invalid job link.</p>;
  if (jobQuery.isPending) return <p className="text-sm text-slate-500">Loading job…</p>;
  if (jobQuery.isError) {
    return (
      <div>
        <p className="error-box mb-4">{errorMessage(jobQuery.error)}</p>
        <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const job = jobQuery.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <article>
        <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to jobs
        </Link>

        <div className="card mt-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="mt-1 text-slate-600">
                {job.company} · {job.location}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
          </div>

          <dl className="mt-4 grid gap-3 border-y border-slate-100 py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Salary</dt>
              <dd className="font-medium text-slate-900">{formatSalary(job)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Posted</dt>
              <dd className="font-medium text-slate-900">{formatDate(job.created_at)}</dd>
            </div>
          </dl>

          {job.skills.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Skills</h2>
              <ul className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <li key={skill} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">About the role</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {job.description}
            </p>
          </div>
        </div>
      </article>

      <aside className="space-y-4 lg:pt-8">
        {isCandidate && <MatchCard jobId={jobId} />}
        <div className="card">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {user?.role === "recruiter" ? "Manage this job" : "Apply for this job"}
          </h2>

          {!job.is_open && (
            <p className="text-sm text-slate-600">This job is closed and no longer accepts applications.</p>
          )}

          {job.is_open && !user && (
            <>
              <p className="mb-3 text-sm text-slate-600">Log in as a candidate to apply.</p>
              <Link to="/login" state={{ from: location.pathname }} className="btn w-full">
                Log in to apply
              </Link>
            </>
          )}

          {user?.role === "recruiter" && job.recruiter_id === user.id && (
            <>
              <p className="mb-3 text-sm text-slate-600">You posted this job.</p>
              <Link to={`/dashboard/jobs/${job.id}/applicants`} className="btn w-full">
                View applicants
              </Link>
            </>
          )}

          {job.is_open && user?.role === "recruiter" && job.recruiter_id !== user.id && (
            <p className="text-sm text-slate-600">
              You are logged in as a recruiter. Only candidates can apply.
            </p>
          )}

          {isCandidate && myApplication && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${STATUS_STYLES[myApplication.status]}`}>
              <p className="font-semibold capitalize">Status: {myApplication.status}</p>
              <p className="text-xs">Applied on {formatDate(myApplication.created_at)}</p>
            </div>
          )}

          {job.is_open && isCandidate && !myApplication && (
            <form onSubmit={handleApply} className="space-y-3">
              {applyMutation.isError && (
                <p className="error-box">{errorMessage(applyMutation.error)}</p>
              )}
              <div>
                <label htmlFor="coverLetter" className="label">
                  Cover letter <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="coverLetter"
                  rows={6}
                  maxLength={5000}
                  className="input"
                  placeholder="Why are you a good fit for this role?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn w-full"
                disabled={applyMutation.isPending || applicationsQuery.isPending}
              >
                {applyMutation.isPending ? "Sending…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
