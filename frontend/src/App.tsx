import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ApplicantsPage from "./pages/ApplicantsPage";
import DashboardPage from "./pages/DashboardPage";
import JobDetailPage from "./pages/JobDetailPage";
import JobsPage from "./pages/JobsPage";
import LoginPage from "./pages/LoginPage";
import PostJobPage from "./pages/PostJobPage";
import RegisterPage from "./pages/RegisterPage";

function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:underline">
        Go to jobs
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/jobs/new"
            element={
              <ProtectedRoute role="recruiter">
                <PostJobPage key="new" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/edit"
            element={
              <ProtectedRoute role="recruiter">
                <PostJobPage key="edit" />
              </ProtectedRoute>
            }
          />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jobs/:id/applicants"
            element={
              <ProtectedRoute role="recruiter">
                <ApplicantsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
