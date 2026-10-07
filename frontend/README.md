# Job Portal Frontend

React + TypeScript + Vite + Tailwind CSS + React Query + React Router.

## Run it

The backend must be running first (`uvicorn app.main:app --reload` in the `backend` folder).

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

## Pages

| Path | Who | What |
|---|---|---|
| / | anyone | Job list with search, filters and pagination |
| /jobs/:id | anyone | Job detail; candidates can apply and see their status |
| /login, /register | anyone | Log in or sign up as candidate or recruiter |
| /jobs/new | recruiter | Post a job |
| /jobs/:id/edit | recruiter | Edit a job |
| /dashboard | logged in | Recruiter: my jobs, stats, close, delete. Candidate: my applications and status |
| /dashboard/jobs/:id/applicants | recruiter | Applicants for a job: shortlist, hire, reject |

## Folder structure

```
src/
  main.tsx            app entry: React Query, Router, Auth providers
  App.tsx             routes
  types.ts            TypeScript types matching the API
  utils.ts            salary, date and error formatting
  api/                client.ts (fetch wrapper + token), auth.ts, jobs.ts
  context/            AuthContext.tsx (login state shared across the app)
  components/         Navbar, JobCard, ProtectedRoute
  pages/              JobsPage, JobDetailPage, LoginPage, RegisterPage, PostJobPage
```
