import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition ${
    isActive ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
          Hire<span className="text-emerald-700">Flow</span>
        </Link>

        <div className="flex items-center gap-4">
          <NavLink to="/" end className={linkClass}>
            Jobs
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === "recruiter" && (
            <NavLink to="/jobs/new" className={linkClass}>
              Post a job
            </NavLink>
          )}

          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.full_name} · {user.role}
              </span>
              <button onClick={handleLogout} className="btn-outline px-3 py-1.5">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link to="/register" className="btn px-3 py-1.5">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
