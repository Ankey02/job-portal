import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMatch, fetchResume, requestAiFeedback } from "../api/resume";
import { errorMessage, scoreColor } from "../utils";

function SkillChips({ skills, className }: { skills: string[]; className: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li key={skill} className={`rounded px-2 py-0.5 text-xs ${className}`}>
          {skill}
        </li>
      ))}
    </ul>
  );
}

/** Shows a candidate how well their resume fits this job. */
export default function MatchCard({ jobId }: { jobId: number }) {
  const resumeQuery = useQuery({ queryKey: ["resume"], queryFn: fetchResume });
  const hasResume = Boolean(resumeQuery.data);

  const matchQuery = useQuery({
    queryKey: ["match", jobId],
    queryFn: () => fetchMatch(jobId),
    enabled: hasResume,
  });

  const feedbackMutation = useMutation({ mutationFn: () => requestAiFeedback(jobId) });

  if (resumeQuery.isPending) return null;

  if (!hasResume) {
    return (
      <div className="card">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Resume match</h2>
        <p className="mb-3 text-sm text-slate-600">
          Upload your resume to see how well you match this job.
        </p>
        <Link to="/dashboard" className="btn-outline w-full">
          Upload resume
        </Link>
      </div>
    );
  }

  if (matchQuery.isPending) {
    return <div className="card text-sm text-slate-500">Calculating your match…</div>;
  }
  if (matchQuery.isError) {
    return <div className="card error-box">{errorMessage(matchQuery.error)}</div>;
  }

  const match = matchQuery.data;
  const colors = scoreColor(match.score);

  return (
    <div className="card space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-900">Resume match</h2>
          <span className={`text-2xl font-bold ${colors.text}`}>{match.score}%</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={match.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Resume match score"
        >
          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${match.score}%` }} />
        </div>
      </div>

      {match.matched_skills.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Skills you have
          </h3>
          <SkillChips skills={match.matched_skills} className="bg-emerald-50 text-emerald-800" />
        </div>
      )}

      {match.missing_skills.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Missing from your resume
          </h3>
          <SkillChips skills={match.missing_skills} className="bg-amber-50 text-amber-800" />
        </div>
      )}

      {match.suggestions.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Suggestions
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
            {match.suggestions.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {match.ai_enabled && (
        <div className="border-t border-slate-100 pt-4">
          {feedbackMutation.data ? (
            <>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                AI feedback
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {feedbackMutation.data.feedback}
              </p>
            </>
          ) : (
            <button
              type="button"
              className="btn-outline w-full"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
            >
              {feedbackMutation.isPending ? "Asking AI… (up to 30 seconds)" : "Get AI feedback"}
            </button>
          )}
          {feedbackMutation.isError && (
            <p className="error-box mt-3">{errorMessage(feedbackMutation.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
