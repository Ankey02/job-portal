import pytest

from app import notifications


@pytest.fixture
def outbox(monkeypatch):
    """Collects emails instead of sending them."""
    sent = []
    monkeypatch.setattr(
        notifications, "send_email", lambda to, subject, body: sent.append((to, subject, body))
    )
    return sent


def apply(client, candidate, job):
    return client.post(f"/jobs/{job['id']}/apply", json={}, headers=candidate).json()["id"]


def test_status_change_emails_candidate(client, recruiter, candidate, job, outbox):
    app_id = apply(client, candidate, job)
    assert outbox == []  # applying sends nothing

    res = client.patch(f"/applications/{app_id}/status", json={"status": "shortlisted"}, headers=recruiter)
    assert res.status_code == 200
    assert len(outbox) == 1
    to, subject, body = outbox[0]
    assert to == "candidate@example.com"
    assert "Python Developer" in subject and "Acme Tech" in subject
    assert "SHORTLISTED" in body


def test_same_status_sends_no_second_email(client, recruiter, candidate, job, outbox):
    app_id = apply(client, candidate, job)
    for _ in range(2):
        client.patch(f"/applications/{app_id}/status", json={"status": "hired"}, headers=recruiter)
    assert len(outbox) == 1


def test_send_email_without_smtp_does_not_fail():
    # conftest switches SMTP off, so this only logs
    notifications.send_email("someone@example.com", "Hello", "Body")
