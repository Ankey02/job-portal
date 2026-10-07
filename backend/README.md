# Job Portal API

FastAPI backend for the AI Job Portal: JWT login with two roles (recruiter, candidate),
job posting with search and filters, job applications, resume upload and resume-to-job matching.

## Run it

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs to try every endpoint in the browser.
Use the **Authorize** button and log in with your email in the `username` field.

It uses SQLite by default, so there is nothing else to install. To switch to
PostgreSQL, set `DATABASE_URL` in `.env`.

## Run the tests

```bash
pytest -v
```

## Endpoints

| Method | Path | Who | What |
|---|---|---|---|
| POST | /auth/register | anyone | Create account, returns token |
| POST | /auth/login | anyone | Log in (form data: username, password) |
| GET | /auth/me | logged in | Current user |
| GET | /jobs | anyone | Open jobs: `q`, `location`, `job_type`, `skip`, `limit` |
| GET | /jobs/{id} | anyone | One job |
| GET | /jobs/mine | recruiter | Jobs I posted |
| POST | /jobs | recruiter | Post a job |
| PUT | /jobs/{id} | job owner | Edit or close (`is_open: false`) |
| DELETE | /jobs/{id} | job owner | Delete |
| POST | /jobs/{id}/apply | candidate | Apply |
| GET | /applications/me | candidate | My applications with status |
| GET | /jobs/{id}/applications | job owner | Applicants for my job |
| PATCH | /applications/{id}/status | job owner | shortlisted / rejected / hired |
| POST | /resume | candidate | Upload a PDF or TXT resume (replaces the old one) |
| GET | /resume | candidate | My resume details, or null |
| GET | /jobs/{id}/match | candidate | Match score, matched and missing skills, suggestions |
| POST | /jobs/{id}/ai-feedback | candidate | AI-written feedback (needs GEMINI_API_KEY) |

## How matching works

`app/matching.py` scores a resume against a job with plain Python, so it needs no API key:
70% of the score is how many of the job's skills appear in the resume (with synonyms such as
Postgres = PostgreSQL), and 30% is word overlap between the resume and the job description.
Recruiters see applicants sorted by this score.

AI feedback is optional. Add `GEMINI_API_KEY=your-key` to `.env` (get one at
https://aistudio.google.com/apikey) and restart the server. Without a key the button is hidden.

## Folder structure

```
app/
  main.py          app setup, CORS, routers
  config.py        settings read from .env
  database.py      engine and session
  models.py        User, Job, Application tables
  schemas.py       request and response shapes (Pydantic)
  security.py      password hashing and JWT
  deps.py          get_current_user, role checks
  matching.py      resume-to-job match score
  resume_parser.py text extraction from PDF and TXT
  ai.py            optional Gemini feedback
  notifications.py status-change emails (background task)
  routers/         auth.py, jobs.py, applications.py, resume.py
tests/             pytest tests for every router
```

## Emails

When a recruiter changes an application's status, the candidate gets an email. It is sent
as a FastAPI background task, after the response. With no SMTP settings the email is printed
in the server terminal; add the `SMTP_*` values from `.env.example` to send real ones.

## Docker

From the project root (`job-portal/`), with Docker Desktop running:

```bash
docker compose up --build
```

This starts PostgreSQL, the API on port 8000 and the frontend on http://localhost:5173.
