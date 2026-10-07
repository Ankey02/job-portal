import type {
  Application,
  ApplicationStatus,
  CandidateApplication,
  Job,
  JobInput,
  JobList,
  RecruiterApplication,
} from "../types";
import { api } from "./client";

export interface JobFilters {
  q?: string;
  location?: string;
  job_type?: string;
  skip?: number;
  limit?: number;
}

export function fetchJobs(filters: JobFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return api<JobList>(`/jobs?${params.toString()}`);
}

export const fetchJob = (id: number) => api<Job>(`/jobs/${id}`);

export const createJob = (data: JobInput) => api<Job>("/jobs", { method: "POST", json: data });

export const applyToJob = (jobId: number, coverLetter: string) =>
  api<Application>(`/jobs/${jobId}/apply`, {
    method: "POST",
    json: { cover_letter: coverLetter },
  });

export const fetchMyApplications = () => api<CandidateApplication[]>("/applications/me");

// ---------- Recruiter ----------
export const fetchMyJobs = () => api<Job[]>("/jobs/mine");

export const updateJob = (id: number, data: Partial<JobInput> & { is_open?: boolean }) =>
  api<Job>(`/jobs/${id}`, { method: "PUT", json: data });

export const deleteJob = (id: number) => api<void>(`/jobs/${id}`, { method: "DELETE" });

export const fetchApplicants = (jobId: number) =>
  api<RecruiterApplication[]>(`/jobs/${jobId}/applications`);

export const updateApplicationStatus = (applicationId: number, status: ApplicationStatus) =>
  api<Application>(`/applications/${applicationId}/status`, {
    method: "PATCH",
    json: { status },
  });
