import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { createJob, fetchJob, updateJob } from "../api/jobs";
import { JOB_TYPE_LABELS } from "../types";
import type { JobInput, JobType } from "../types";
import { errorMessage } from "../utils";

const emptyForm = {
  title: "",
  company: "",
  location: "",
  job_type: "full_time" as JobType,
  description: "",
  skills: "",
  salary_min: "",
  salary_max: "",
};

/** Used for both "Post a job" (/jobs/new) and "Edit job" (/jobs/:id/edit). */
export default function PostJobPage() {
  const params = useParams();
  const editId = params.id ? Number(params.id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  // In edit mode, load the job and fill the form with its current values
  const jobQuery = useQuery({
    queryKey: ["job", editId],
    queryFn: () => fetchJob(editId as number),
    enabled: editId !== null,
  });

  useEffect(() => {
    const job = jobQuery.data;
    if (!job) return;
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      job_type: job.job_type,
      description: job.description,
      skills: job.skills.join(", "),
      salary_min: job.salary_min?.toString() ?? "",
      salary_max: job.salary_max?.toString() ?? "",
    });
  }, [jobQuery.data]);

  function setField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload: JobInput = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        job_type: form.job_type,
        description: form.description.trim(),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
      };
      return editId !== null ? updateJob(editId, payload) : createJob(payload);
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      navigate(editId !== null ? "/dashboard" : `/jobs/${job.id}`);
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mutation.mutate();
  }

  if (editId !== null && jobQuery.isPending) {
    return <p className="text-sm text-slate-500">Loading job…</p>;
  }
  if (editId !== null && jobQuery.isError) {
    return <p className="error-box">{errorMessage(jobQuery.error)}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        {editId !== null ? "Edit job" : "Post a job"}
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        {editId !== null
          ? "Changes are visible to candidates as soon as you save."
          : "It goes live for candidates as soon as you publish."}
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {mutation.isError && <p className="error-box">{errorMessage(mutation.error)}</p>}

        <div>
          <label htmlFor="title" className="label">Job title</label>
          <input
            id="title"
            required
            minLength={3}
            className="input"
            placeholder="Python Developer"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company" className="label">Company</label>
            <input
              id="company"
              required
              minLength={2}
              className="input"
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="location" className="label">Location</label>
            <input
              id="location"
              required
              minLength={2}
              className="input"
              placeholder="Bengaluru"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="jobType" className="label">Job type</label>
            <select
              id="jobType"
              className="input"
              value={form.job_type}
              onChange={(e) => setField("job_type", e.target.value)}
            >
              {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="salaryMin" className="label">Min salary (₹ / year)</label>
            <input
              id="salaryMin"
              type="number"
              min={0}
              className="input"
              placeholder="600000"
              value={form.salary_min}
              onChange={(e) => setField("salary_min", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="salaryMax" className="label">Max salary (₹ / year)</label>
            <input
              id="salaryMax"
              type="number"
              min={0}
              className="input"
              placeholder="1200000"
              value={form.salary_max}
              onChange={(e) => setField("salary_max", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="skills" className="label">Skills</label>
          <input
            id="skills"
            className="input"
            placeholder="python, fastapi, postgresql"
            value={form.skills}
            onChange={(e) => setField("skills", e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">Separate skills with commas.</p>
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            required
            minLength={20}
            rows={7}
            className="input"
            placeholder="What will this person work on? What do you expect from them?"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn">
          {mutation.isPending ? "Saving…" : editId !== null ? "Save changes" : "Publish job"}
        </button>
      </form>
    </div>
  );
}
