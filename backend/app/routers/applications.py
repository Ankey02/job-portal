from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import require_candidate, require_recruiter
from ..matching import compute_match
from .. import notifications
from ..models import Application, Resume, User
from ..schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    CandidateApplicationOut,
    RecruiterApplicationOut,
)
from .jobs import get_job_or_404, get_own_job

router = APIRouter(tags=["applications"])


@router.post(
    "/jobs/{job_id}/apply",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: int,
    data: ApplicationCreate,
    candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
):
    job = get_job_or_404(job_id, db)
    if not job.is_open:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This job is closed")
    already = db.scalar(
        select(Application).where(
            Application.job_id == job_id, Application.candidate_id == candidate.id
        )
    )
    if already:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already applied to this job")
    application = Application(
        job_id=job_id, candidate_id=candidate.id, cover_letter=data.cover_letter
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications/me", response_model=list[CandidateApplicationOut])
def my_applications(
    candidate: User = Depends(require_candidate), db: Session = Depends(get_db)
):
    """Candidate dashboard: every job I applied to and its current status."""
    return db.scalars(
        select(Application)
        .where(Application.candidate_id == candidate.id)
        .options(selectinload(Application.job))
        .order_by(Application.id.desc())
    ).all()


@router.get("/jobs/{job_id}/applications", response_model=list[RecruiterApplicationOut])
def job_applicants(
    job_id: int,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Recruiter dashboard: applicants for one of my jobs, best resume match first."""
    job = get_own_job(job_id, recruiter, db)
    applications = db.scalars(
        select(Application)
        .where(Application.job_id == job_id)
        .options(selectinload(Application.candidate))
        .order_by(Application.id.desc())
    ).all()

    candidate_ids = [a.candidate_id for a in applications]
    resumes = {}
    if candidate_ids:
        found = db.scalars(select(Resume).where(Resume.candidate_id.in_(candidate_ids)))
        resumes = {r.candidate_id: r for r in found}

    skills = [s for s in (job.skills or "").split(",") if s]
    result = []
    for application in applications:
        item = RecruiterApplicationOut.model_validate(application)
        resume = resumes.get(application.candidate_id)
        if resume:
            item.match_score = compute_match(resume.text, job.title, job.description, skills)["score"]
        result.append(item)

    # Highest score first; candidates without a resume go last
    result.sort(key=lambda a: -1 if a.match_score is None else a.match_score, reverse=True)
    return result


@router.patch("/applications/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    job = get_own_job(application.job_id, recruiter, db)

    changed = application.status != data.status
    application.status = data.status
    db.commit()
    db.refresh(application)

    if changed:
        # Runs after the response is sent. Plain strings are passed because the
        # database session is closed by then.
        candidate = application.candidate
        background_tasks.add_task(
            notifications.send_status_email,
            candidate.email,
            candidate.full_name,
            job.title,
            job.company,
            data.status.value,
        )
    return application
