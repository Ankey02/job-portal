import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMyApplications } from "../api/jobs";
import ResumeCard from "../components/ResumeCard";
import StatusBadge from "../components/StatusBadge";
import { StatTiles, StatusChart } from "../components/StatTiles";
import { errorMessage, formatDate } from "../utils";

export default function CandidateDashboard() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: fetchMyApplications,
  });

  if (isPending) return <p className="text-sm text-slate-500">Loading your applications…</p>;
  if (isError) return <p className="error-box">{errorMessage(error)}</p>;

  const count = (status: string) => data.filter((a) => a.status === status).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My applications</h1>
        <p className="text-sm text-slate-600">Track every job you applied to.</p>
      </div>

      <ResumeCard />

      <StatTiles
        stats={[
          { label: "Applied", value: data.length },
          { label: "Shortlisted", value: count("shortlisted") },
          { label: "Hired", value: count("hired") },
          { label: "Rejected", value: count("rejected") },
        ]}
      />

      <StatusChart statuses={data.map((a) => a.status)} />

      {data.length === 0 ? (
        <div className="card text-center text-sm text-slate-600">
          You have not applied to any job yet.{" "}
          <Link to="/" className="font-medium text-emerald-700 hover:underline">
            Browse jobs
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((application) => (
            <li key={application.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  to={`/jobs/${application.job.id}`}
                  className="font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {application.job.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {application.job.company} · {application.job.location}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Applied on {formatDate(application.created_at)}
                  {!application.job.is_open && " · Job closed"}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
