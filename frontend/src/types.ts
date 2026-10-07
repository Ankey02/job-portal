export type Role = "recruiter" | "candidate";

export type JobType = "full_time" | "part_time" | "internship" | "contract" | "remote";

export type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "hired";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  is_open: boolean;
  created_at: string;
  recruiter_id: number;
}

export interface JobList {
  total: number;
  items: Job[];
}

export interface JobInput {
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
}

export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  cover_letter: string;
  status: ApplicationStatus;
  created_at: string;
}

export interface CandidateApplication extends Application {
  job: Job;
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  internship: "Internship",
  contract: "Contract",
  remote: "Remote",
};

export interface RecruiterApplication extends Application {
  candidate: User;
  match_score: number | null;
}

export interface Resume {
  filename: string;
  updated_at: string;
  word_count: number;
  preview: string;
}

export interface MatchResult {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
  ai_enabled: boolean;
}

export const STATUSES: ApplicationStatus[] = ["applied", "shortlisted", "rejected", "hired"];
