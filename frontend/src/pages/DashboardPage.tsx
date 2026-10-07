import { useAuth } from "../context/AuthContext";
import CandidateDashboard from "./CandidateDashboard";
import RecruiterDashboard from "./RecruiterDashboard";

/** One /dashboard address that shows the right dashboard for the logged-in role. */
export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === "recruiter" ? <RecruiterDashboard /> : <CandidateDashboard />;
}
