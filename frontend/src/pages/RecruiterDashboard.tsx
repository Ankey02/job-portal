import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { deleteJob, fetchApplicants, fetchMyJobs, updateJob } from "../api/jobs";
import { StatTiles, StatusChart } from "../components/StatTiles";
import type { Job } from "../types";
import { errorMessage, formatDate } from "../utils";

export default function RecruiterDashboard() {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({ queryKey: ["my-jobs"], queryFn: fetchMyJobs });
  const jobs = jobsQuery.data ?? [];

  // One request per job to load its applicants. Fine for a dashboard with a few jobs.
  const applicantQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ["applicants", job.id],
      queryFn: () => fetchApplicants(job.id),
    })),
  });
  const allApplications = applicantQueries.flatMap((q) => q.data ?? []);

  function refreshJobs() {
    queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    queryClient.invalidateQueries({ queryKey: ["job"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (job: Job) => updateJob(job.id, { is_open: !job.is_open }),
    onSuccess: refreshJobs,
  });

  const deleteMutation = useMutation({
    mutationFn: (job: Job) => deleteJob(job.id),
    onSuccess: refreshJobs,
  });

  function handleDelete(job: Job) {
    if (window.confirm(`Delete "${job.title}"? Its applications will be deleted too.`)) {
      deleteMutation.mutate(job);
    }
  }

  if (jobsQuery.isPending) return <p className="text-sm text-slate-500">Loading your jobs…</p>;
  if (jobsQuery.isError) return <p className="error-box">{errorMessage(jobsQuery.error)}</p>;

  const actionError = toggleMutation.error ?? deleteMutation.error;
  const busy = toggleMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruiter dashboard</h1>
          <p className="text-sm text-slate-600">Manage your jobs and review applicants.</p>
        </div>
        <Link to="/jobs/new" className="btn">
          Post a job
        </Link>
      </div>

      <StatTiles
        stats={[
          { label: "Open jobs", value: jobs.filter((j) => j.is_open).length },
          { label: "Applicants", value: allApplications.length },
          { label: "Shortlisted", value: allApplications.filter((a) => a.status === "shortlisted").length },
          { label: "Hired", value: allApplications.filter((a) => a.status === "hired").length },
        ]}
      />

      <StatusChart statuses={allApplications.map((a) => a.status)} />

      {actionError && <p className="error-box">{errorMessage(actionError)}</p>}

      {jobs.length === 0 ? (
        <div className="card text-center text-sm text-slate-600">
          You have not posted any job yet.{" "}
          <Link to="/jobs/new" className="font-medium text-emerald-700 hover:underline">
            Post your first job
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job, index) => {
            const applicants = applicantQueries[index]?.data;
            return (
              <li key={job.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                      {job.title}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {job.company} · {job.location} · Posted {formatDate(job.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      job.is_open ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {job.is_open ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link to={`/dashboard/jobs/${job.id}/applicants`} className="btn px-3 py-1.5">
                    Applicants ({applicants ? applicants.length : "…"})
                  </Link>
                  <Link to={`/jobs/${job.id}/edit`} className="btn-outline px-3 py-1.5">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn-outline px-3 py-1.5"
                    disabled={busy}
                    onClick={() => toggleMutation.mutate(job)}
                  >
                    {job.is_open ? "Close job" : "Reopen job"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline px-3 py-1.5 text-red-700 hover:bg-red-50"
                    disabled={busy}
                    onClick={() => handleDelete(job)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
