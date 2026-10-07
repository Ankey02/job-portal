import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchJobs } from "../api/jobs";
import JobCard from "../components/JobCard";
import { JOB_TYPE_LABELS } from "../types";
import { errorMessage } from "../utils";

const PAGE_SIZE = 6;

export default function JobsPage() {
  // Filters live in the URL (?q=python&page=2) so a search can be shared or refreshed
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const location = params.get("location") ?? "";
  const jobType = params.get("job_type") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [qInput, setQInput] = useState(q);
  const [locationInput, setLocationInput] = useState(location);

  // Keep the text boxes in sync when the URL changes (for example the Back button)
  useEffect(() => {
    setQInput(q);
    setLocationInput(location);
  }, [q, location]);

  const { data, isPending, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["jobs", { q, location, jobType, page }],
    queryFn: () =>
      fetchJobs({
        q,
        location,
        job_type: jobType,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  function updateParams(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next);
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateParams({ q: qInput.trim(), location: locationInput.trim(), page: "" });
  }

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(q || location || jobType);

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Find your next <span className="text-emerald-700">tech job</span>
        </h1>
        <p className="mt-1 text-slate-600">Search open roles by skill, company or city.</p>
      </section>

      <form onSubmit={handleSearch} className="card mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          aria-label="Search by title, company or skill"
          placeholder="Title, company or skill"
          className="input"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <input
          aria-label="Location"
          placeholder="Location"
          className="input"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
        />
        <select
          aria-label="Job type"
          className="input"
          value={jobType}
          onChange={(e) => updateParams({ job_type: e.target.value, page: "" })}
        >
          <option value="">All types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {isPending && <p className="text-sm text-slate-500">Loading jobs…</p>}
      {isError && <p className="error-box">{errorMessage(error)}</p>}

      {data && (
        <>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
            <span>
              {total} {total === 1 ? "job" : "jobs"} found
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setParams({})}
                className="font-medium text-emerald-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <div className="card text-center text-sm text-slate-600">
              {hasFilters
                ? "No jobs match your search. Try a different keyword."
                : "No jobs posted yet. Sign up as a recruiter to post the first one."}
            </div>
          ) : (
            <div className={`grid gap-4 sm:grid-cols-2 ${isPlaceholderData ? "opacity-60" : ""}`}>
              {data.items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                className="btn-outline"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={page >= pageCount}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
