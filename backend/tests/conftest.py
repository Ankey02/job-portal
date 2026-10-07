import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import app

JOB = {
    "title": "Python Developer",
    "company": "Acme Tech",
    "location": "Bengaluru",
    "job_type": "full_time",
    "description": "Build and maintain REST APIs with FastAPI and PostgreSQL.",
    "skills": ["Python", "FastAPI", "python"],
    "salary_min": 600000,
    "salary_max": 1200000,
}


@pytest.fixture(autouse=True)
def no_real_email(monkeypatch):
    """Tests must never send real emails, even if SMTP is set up in .env."""
    monkeypatch.setattr(settings, "smtp_host", "")


@pytest.fixture
def client():
    # A fresh in-memory database for every test
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def signup(client, email, role):
    res = client.post(
        "/auth/register",
        json={"email": email, "full_name": "Test User", "password": "secret123", "role": role},
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def recruiter(client):
    return signup(client, "recruiter@example.com", "recruiter")


@pytest.fixture
def candidate(client):
    return signup(client, "candidate@example.com", "candidate")


@pytest.fixture
def job(client, recruiter):
    res = client.post("/jobs", json=JOB, headers=recruiter)
    assert res.status_code == 201, res.text
    return res.json()
