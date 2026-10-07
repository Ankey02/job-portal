from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai import AIError, ai_enabled, get_ai_feedback
from ..config import settings
from ..database import get_db
from ..deps import require_candidate
from ..matching import compute_match
from ..models import Job, Resume, User, utcnow
from ..resume_parser import ResumeError, extract_text
from ..schemas import AIFeedbackOut, MatchOut, ResumeOut
from .jobs import get_job_or_404

router = APIRouter(tags=["resume"])


def job_skills(job: Job) -> list[str]:
    return [s for s in (job.skills or "").split(",") if s]


def get_resume(candidate: User, db: Session) -> Resume | None:
    return db.scalar(select(Resume).where(Resume.candidate_id == candidate.id))


def require_resume(candidate: User, db: Session) -> Resume:
    resume = get_resume(candidate, db)
    if resume is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Upload your resume first")
    return resume


def to_out(resume: Resume) -> ResumeOut:
    return ResumeOut(
        filename=resume.filename,
        updated_at=resume.updated_at,
        word_count=len(resume.text.split()),
        preview=resume.text[:300],
    )


@router.post("/resume", response_model=ResumeOut)
def upload_resume(
    file: UploadFile,
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    """Upload a PDF or TXT resume. A new upload replaces the old one."""
    data = file.file.read(settings.max_resume_bytes + 1)
    if len(data) > settings.max_resume_bytes:
        raise HTTPException(413, "File is larger than 2 MB")
    try:
        text = extract_text(file.filename or "", data)
    except ResumeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    resume = get_resume(candidate, db)
    if resume is None:
        resume = Resume(candidate_id=candidate.id)
        db.add(resume)
    resume.filename = (file.filename or "resume")[:255]
    resume.text = text
    resume.updated_at = utcnow()
    db.commit()
    db.refresh(resume)
    return to_out(resume)


@router.get("/resume", response_model=ResumeOut | None)
def my_resume(candidate: User = Depends(require_candidate), db: Session = Depends(get_db)):
    """Returns null when the candidate has not uploaded a resume yet."""
    resume = get_resume(candidate, db)
    return to_out(resume) if resume else None


@router.get("/jobs/{job_id}/match", response_model=MatchOut)
def match_job(
    job_id: int,
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    job = get_job_or_404(job_id, db)
    resume = require_resume(candidate, db)
    result = compute_match(resume.text, job.title, job.description, job_skills(job))
    return MatchOut(**result, ai_enabled=ai_enabled())


@router.post("/jobs/{job_id}/ai-feedback", response_model=AIFeedbackOut)
def ai_feedback(
    job_id: int,
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    if not ai_enabled():
        raise HTTPException(503, "AI feedback is not set up on this server")
    job = get_job_or_404(job_id, db)
    resume = require_resume(candidate, db)
    match = compute_match(resume.text, job.title, job.description, job_skills(job))
    try:
        feedback = get_ai_feedback(resume.text, job.title, job.description, match)
    except AIError as exc:
        raise HTTPException(502, str(exc))
    return AIFeedbackOut(feedback=feedback)
