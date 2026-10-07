from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from .models import ApplicationStatus, JobType, Role


# ---------- Users ----------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=72)
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: Role


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Jobs ----------
class JobBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    company: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=120)
    job_type: JobType = JobType.full_time
    description: str = Field(min_length=20)
    skills: list[str] = []
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def check_salary_range(self):
        if self.salary_min and self.salary_max and self.salary_min > self.salary_max:
            raise ValueError("salary_min cannot be greater than salary_max")
        return self


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    """All fields optional so the frontend can send only what changed."""

    title: str | None = Field(default=None, min_length=3, max_length=150)
    company: str | None = None
    location: str | None = None
    job_type: JobType | None = None
    description: str | None = Field(default=None, min_length=20)
    skills: list[str] | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    is_open: bool | None = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company: str
    location: str
    job_type: JobType
    description: str
    skills: list[str]
    salary_min: int | None
    salary_max: int | None
    is_open: bool
    created_at: datetime
    recruiter_id: int

    @model_validator(mode="before")
    @classmethod
    def split_skills(cls, data):
        # The database stores skills as "python,react"; the API returns a list
        if not isinstance(data, dict):
            raw = data.skills or ""
            data = {c: getattr(data, c) for c in cls.model_fields}
            data["skills"] = [s for s in raw.split(",") if s]
        return data


class JobList(BaseModel):
    total: int
    items: list[JobOut]


# ---------- Applications ----------
class ApplicationCreate(BaseModel):
    cover_letter: str = Field(default="", max_length=5000)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    candidate_id: int
    cover_letter: str
    status: ApplicationStatus
    created_at: datetime


class CandidateApplicationOut(ApplicationOut):
    job: JobOut


class RecruiterApplicationOut(ApplicationOut):
    candidate: UserOut
    match_score: int | None = None  # None when the candidate has no resume


# ---------- Resume and matching ----------
class ResumeOut(BaseModel):
    filename: str
    updated_at: datetime
    word_count: int
    preview: str


class MatchOut(BaseModel):
    score: int
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    ai_enabled: bool


class AIFeedbackOut(BaseModel):
    feedback: str
