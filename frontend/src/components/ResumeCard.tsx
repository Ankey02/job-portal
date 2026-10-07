import { useRef } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchResume, uploadResume } from "../api/resume";
import { errorMessage, formatDate } from "../utils";

export default function ResumeCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const resumeQuery = useQuery({ queryKey: ["resume"], queryFn: fetchResume });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      queryClient.invalidateQueries({ queryKey: ["match"] }); // scores depend on the resume
    },
  });

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = ""; // lets the same file be chosen again
  }

  const resume = resumeQuery.data;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">My resume</h2>
          {resumeQuery.isPending && <p className="text-sm text-slate-500">Loading…</p>}
          {resumeQuery.isSuccess && !resume && (
            <p className="text-sm text-slate-600">
              Upload your resume to see a match score on every job.
            </p>
          )}
          {resume && (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{resume.filename}</span> ·{" "}
              {resume.word_count} words · updated {formatDate(resume.updated_at)}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="sr-only"
          aria-label="Choose resume file"
          onChange={handleFile}
        />
        <button
          type="button"
          className={resume ? "btn-outline" : "btn"}
          disabled={uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {uploadMutation.isPending ? "Uploading…" : resume ? "Replace resume" : "Upload resume"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">PDF or TXT, up to 2 MB.</p>
      {uploadMutation.isError && (
        <p className="error-box mt-3">{errorMessage(uploadMutation.error)}</p>
      )}
      {resumeQuery.isError && <p className="error-box mt-3">{errorMessage(resumeQuery.error)}</p>}
    </section>
  );
}
