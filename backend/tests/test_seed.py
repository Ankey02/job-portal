from app.database import get_db
from app.main import app
from app.seed import DEMO_CANDIDATE, DEMO_PASSWORD, DEMO_RECRUITER, JOBS, seed


def test_seed_adds_demo_data_once(client):
    db = next(app.dependency_overrides[get_db]())
    assert seed(db) is True
    assert seed(db) is False  # running it again changes nothing
    db.close()

    assert client.get("/jobs", params={"limit": 50}).json()["total"] == len(JOBS)
    for email in (DEMO_RECRUITER, DEMO_CANDIDATE):
        res = client.post("/auth/login", data={"username": email, "password": DEMO_PASSWORD})
        assert res.status_code == 200, res.text
