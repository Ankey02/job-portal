import type { MatchResult, Resume } from "../types";
import { api } from "./client";

/** Returns null when no resume has been uploaded yet. */
export const fetchResume = () => api<Resume | null>("/resume");

export function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api<Resume>("/resume", { method: "POST", formData });
}

export const fetchMatch = (jobId: number) => api<MatchResult>(`/jobs/${jobId}/match`);

export const requestAiFeedback = (jobId: number) =>
  api<{ feedback: string }>(`/jobs/${jobId}/ai-feedback`, { method: "POST" });
