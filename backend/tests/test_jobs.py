from .conftest import JOB, signup


def test_recruiter_creates_job(job):
    assert job["title"] == "Python Developer"
    assert job["skills"] == ["python", "fastapi"]  # cleaned, no duplicates
    assert job["is_open"] is True


def test_candidate_cannot_create_job(client, candidate):
    assert client.post("/jobs", json=JOB, headers=candidate).status_code == 403


def test_bad_salary_range_rejected(client, recruiter):
    bad = {**JOB, "salary_min": 900, "salary_max": 100}
    assert client.post("/jobs", json=bad, headers=recruiter).status_code == 422


def test_search_and_filters(client, recruiter, job):
    client.post(
        "/jobs",
        json={**JOB, "title": "React Developer", "location": "Pune", "skills": ["react"]},
        headers=recruiter,
    )
    assert client.get("/jobs").json()["total"] == 2
    assert client.get("/jobs", params={"q": "react"}).json()["total"] == 1
    assert client.get("/jobs", params={"location": "pune"}).json()["total"] == 1
    assert client.get("/jobs", params={"job_type": "internship"}).json()["total"] == 0
    page = client.get("/jobs", params={"limit": 1}).json()
    assert page["total"] == 2 and len(page["items"]) == 1


def test_update_close_and_delete(client, recruiter, job):
    url = f"/jobs/{job['id']}"
    res = client.put(url, json={"is_open": False, "title": "Senior Python Developer"}, headers=recruiter)
    assert res.json()["title"] == "Senior Python Developer"
    assert client.get("/jobs").json()["total"] == 0  # closed jobs are hidden
    assert len(client.get("/jobs/mine", headers=recruiter).json()) == 1
    assert client.delete(url, headers=recruiter).status_code == 204
    assert client.get(url).status_code == 404


def test_other_recruiter_cannot_edit(client, job):
    other = signup(client, "other@example.com", "recruiter")
    url = f"/jobs/{job['id']}"
    assert client.put(url, json={"title": "Hacked title"}, headers=other).status_code == 403
    assert client.delete(url, headers=other).status_code == 403
