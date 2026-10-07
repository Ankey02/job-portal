from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_recruiter
from ..models import Job, JobType, User
from ..schemas import JobCreate, JobList, JobOut, JobUpdate

router = APIRouter(prefix="/jobs", tags=["jobs"])


def clean_skills(skills: list[str]) -> str:
    """['Python', ' React '] -> 'python,react' (no duplicates)."""
    seen: list[str] = []
    for s in skills:
        s = s.strip().lower()
        if s and s not in seen:
            seen.append(s)
    return ",".join(seen)


def get_job_or_404(job_id: int, db: Session) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


def get_own_job(job_id: int, recruiter: User, db: Session) -> Job:
    job = get_job_or_404(job_id, db)
    if job.recruiter_id != recruiter.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You did not post this job")
    return job


@router.get("", response_model=JobList)
def list_jobs(
    q: str | None = Query(None, description="Search in title, company and skills"),
    location: str | None = None,
    job_type: JobType | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Public list of open jobs with search, filters and pagination."""
    query = select(Job).where(Job.is_open.is_(True))
    if q:
        like = f"%{q.lower()}%"
        query = query.where(
            or_(
                func.lower(Job.title).like(like),
                func.lower(Job.company).like(like),
                Job.skills.like(like),
            )
        )
    if location:
        query = query.where(func.lower(Job.location).like(f"%{location.lower()}%"))
    if job_type:
        query = query.where(Job.job_type == job_type)

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.order_by(Job.created_at.desc(), Job.id.desc()).offset(skip).limit(limit)
    ).all()
    return JobList(total=total, items=items)


@router.get("/mine", response_model=list[JobOut])
def my_jobs(recruiter: User = Depends(require_recruiter), db: Session = Depends(get_db)):
    """All jobs posted by the logged-in recruiter, open and closed."""
    return db.scalars(
        select(Job).where(Job.recruiter_id == recruiter.id).order_by(Job.id.desc())
    ).all()


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    return get_job_or_404(job_id, db)


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    data: JobCreate,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    values = data.model_dump()
    values["skills"] = clean_skills(values["skills"])
    job = Job(**values, recruiter_id=recruiter.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    data: JobUpdate,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    job = get_own_job(job_id, recruiter, db)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    if "skills" in changes and changes["skills"] is not None:
        changes["skills"] = clean_skills(changes["skills"])
    for field, value in changes.items():
        setattr(job, field, value)
    if job.salary_min and job.salary_max and job.salary_min > job.salary_max:
        raise HTTPException(422, "salary_min cannot be greater than salary_max")
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    recruiter: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    job = get_own_job(job_id, recruiter, db)
    db.delete(job)
    db.commit()
