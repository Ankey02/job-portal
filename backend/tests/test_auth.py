from .conftest import signup


def test_register_login_and_me(client):
    signup(client, "a@example.com", "candidate")
    res = client.post("/auth/login", data={"username": "A@example.com", "password": "secret123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email"] == "a@example.com"
    assert "hashed_password" not in me.json()


def test_duplicate_email_rejected(client):
    signup(client, "a@example.com", "candidate")
    res = client.post(
        "/auth/register",
        json={"email": "a@example.com", "full_name": "Again", "password": "secret123", "role": "recruiter"},
    )
    assert res.status_code == 409


def test_wrong_password(client):
    signup(client, "a@example.com", "candidate")
    res = client.post("/auth/login", data={"username": "a@example.com", "password": "wrongpass"})
    assert res.status_code == 401


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401
    bad = client.get("/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert bad.status_code == 401
