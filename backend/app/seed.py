"""Fill the database with demo accounts and jobs.

Run from the backend folder:   python -m app.seed
Safe to run more than once: it does nothing if the demo recruiter already exists.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Job, JobType, Role, User
from .routers.jobs import clean_skills
from .security import hash_password

DEMO_RECRUITER = "demo.recruiter@example.com"
DEMO_CANDIDATE = "demo.candidate@example.com"
DEMO_PASSWORD = "demo1234"

JOBS = [
    ("Python Backend Developer", "Bengaluru", JobType.full_time, 800000, 1600000,
     ["python", "fastapi", "postgresql", "docker", "rest api"],
     "Build and maintain REST APIs with FastAPI and PostgreSQL. Write tests with pytest and ship with Docker."),
    ("Full Stack Developer", "Pune", JobType.full_time, 900000, 1800000,
     ["python", "react", "typescript", "postgresql", "aws"],
     "Work across a React and TypeScript frontend and a Python backend. Own features from database to UI."),
    ("React Frontend Developer", "Hyderabad", JobType.full_time, 700000, 1400000,
     ["react", "typescript", "tailwind", "javascript"],
     "Build responsive interfaces with React, TypeScript and Tailwind CSS. Work closely with designers."),
    ("Machine Learning Engineer", "Remote", JobType.remote, 1200000, 2400000,
     ["python", "machine learning", "scikit-learn", "docker", "aws"],
     "Train, evaluate and deploy machine learning models. Serve predictions through Python APIs."),
    ("Python Developer Intern", "Jaipur", JobType.internship, 180000, 300000,
     ["python", "git", "mysql"],
     "Six month internship. Learn backend development with Python, SQL databases and Git on real projects."),
    ("DevOps Engineer", "Gurugram", JobType.contract, 1000000, 2000000,
     ["docker", "kubernetes", "aws", "ci/cd", "python"],
     "Run CI/CD pipelines, containers and cloud infrastructure. Automate deployments with Python scripts."),
]


def seed(db: Session) -> bool:
    """Returns True if demo data was added, False if it was already there."""
    if db.scalar(select(User).where(User.email == DEMO_RECRUITER)):
        return False

    recruiter = User(
        email=DEMO_RECRUITER,
        full_name="Demo Recruiter",
        hashed_password=hash_password(DEMO_PASSWORD),
        role=Role.recruiter,
    )
    candidate = User(
        email=DEMO_CANDIDATE,
        full_name="Demo Candidate",
        hashed_password=hash_password(DEMO_PASSWORD),
        role=Role.candidate,
    )
    db.add_all([recruiter, candidate])
    db.flush()  # gives recruiter.id before the jobs are created

    for title, location, job_type, salary_min, salary_max, skills, description in JOBS:
        db.add(
            Job(
                title=title,
                company="HireFlow Demo",
                location=location,
                job_type=job_type,
                description=description,
                skills=clean_skills(skills),
                salary_min=salary_min,
                salary_max=salary_max,
                recruiter_id=recruiter.id,
            )
        )
    db.commit()
    return True


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        added = seed(session)
    print("Demo data added." if added else "Demo data already exists, nothing changed.")
    print(f"Recruiter: {DEMO_RECRUITER} / {DEMO_PASSWORD}")
    print(f"Candidate: {DEMO_CANDIDATE} / {DEMO_PASSWORD}")
