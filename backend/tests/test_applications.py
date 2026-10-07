from .conftest import signup


def test_full_application_flow(client, recruiter, candidate, job):
    apply_url = f"/jobs/{job['id']}/apply"
    res = client.post(apply_url, json={"cover_letter": "I love Python."}, headers=candidate)
    assert res.status_code == 201
    app_id = res.json()["id"]
    assert res.json()["status"] == "applied"

    # Cannot apply twice
    assert client.post(apply_url, json={}, headers=candidate).status_code == 409

    # Recruiter sees the applicant
    applicants = client.get(f"/jobs/{job['id']}/applications", headers=recruiter).json()
    assert applicants[0]["candidate"]["email"] == "candidate@example.com"

    # Recruiter shortlists, candidate sees the new status
    res = client.patch(f"/applications/{app_id}/status", json={"status": "shortlisted"}, headers=recruiter)
    assert res.status_code == 200
    mine = client.get("/applications/me", headers=candidate).json()
    assert mine[0]["status"] == "shortlisted"
    assert mine[0]["job"]["title"] == "Python Developer"


def test_recruiter_cannot_apply(client, recruiter, job):
    assert client.post(f"/jobs/{job['id']}/apply", json={}, headers=recruiter).status_code == 403


def test_cannot_apply_to_closed_job(client, recruiter, candidate, job):
    client.put(f"/jobs/{job['id']}", json={"is_open": False}, headers=recruiter)
    assert client.post(f"/jobs/{job['id']}/apply", json={}, headers=candidate).status_code == 400


def test_other_recruiter_cannot_see_or_change_applications(client, candidate, job):
    app_id = client.post(f"/jobs/{job['id']}/apply", json={}, headers=candidate).json()["id"]
    other = signup(client, "other@example.com", "recruiter")
    assert client.get(f"/jobs/{job['id']}/applications", headers=other).status_code == 403
    res = client.patch(f"/applications/{app_id}/status", json={"status": "hired"}, headers=other)
    assert res.status_code == 403
