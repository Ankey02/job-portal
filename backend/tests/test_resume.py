from app.config import settings

from .conftest import signup

RESUME = (
    b"Ankit Sharma - Python Developer. Built REST APIs with FastAPI and Postgres "
    b"for 3 client projects. Frontend work in ReactJS and TypeScript. Deployed with Docker."
)


def upload(client, headers, name="resume.txt", data=RESUME):
    return client.post("/resume", files={"file": (name, data, "text/plain")}, headers=headers)


def test_upload_and_get_resume(client, candidate):
    assert client.get("/resume", headers=candidate).json() is None
    res = upload(client, candidate)
    assert res.status_code == 200, res.text
    assert res.json()["filename"] == "resume.txt"
    assert res.json()["word_count"] > 10

    # Uploading again replaces the old one
    upload(client, candidate, name="new.txt")
    assert client.get("/resume", headers=candidate).json()["filename"] == "new.txt"


def test_bad_files_rejected(client, candidate):
    assert upload(client, candidate, name="resume.docx").status_code == 400
    assert upload(client, candidate, data=b"too short").status_code == 400
    assert upload(client, candidate, name="fake.pdf", data=b"this is not a real pdf file" * 5).status_code == 400


def test_recruiter_cannot_upload(client, recruiter):
    assert upload(client, recruiter).status_code == 403


def test_match_needs_resume_then_scores(client, candidate, job):
    url = f"/jobs/{job['id']}/match"
    assert client.get(url, headers=candidate).status_code == 404
    upload(client, candidate)
    match = client.get(url, headers=candidate).json()
    assert match["matched_skills"] == ["python", "fastapi"]
    assert match["missing_skills"] == []
    assert match["score"] >= 70


def test_applicants_ranked_by_match_score(client, recruiter, candidate, job):
    weak = signup(client, "weak@example.com", "candidate")
    no_resume = signup(client, "noresume@example.com", "candidate")
    upload(client, candidate)
    upload(client, weak, data=b"Experienced chef and restaurant manager with ten years in kitchens and catering.")
    for headers in (no_resume, weak, candidate):
        assert client.post(f"/jobs/{job['id']}/apply", json={}, headers=headers).status_code == 201

    applicants = client.get(f"/jobs/{job['id']}/applications", headers=recruiter).json()
    emails = [a["candidate"]["email"] for a in applicants]
    assert emails == ["candidate@example.com", "weak@example.com", "noresume@example.com"]
    assert applicants[0]["match_score"] > applicants[1]["match_score"]
    assert applicants[2]["match_score"] is None


def test_ai_feedback_off_without_key(client, candidate, job, monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "")
    upload(client, candidate)
    assert client.get(f"/jobs/{job['id']}/match", headers=candidate).json()["ai_enabled"] is False
    assert client.post(f"/jobs/{job['id']}/ai-feedback", headers=candidate).status_code == 503


def test_ai_feedback_with_key(client, candidate, job, monkeypatch):
    # Replace the real API call so the test needs no key and no internet
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr("app.routers.resume.get_ai_feedback", lambda *args: "Strengths: Python.")
    upload(client, candidate)
    res = client.post(f"/jobs/{job['id']}/ai-feedback", headers=candidate)
    assert res.status_code == 200
    assert res.json()["feedback"] == "Strengths: Python."
