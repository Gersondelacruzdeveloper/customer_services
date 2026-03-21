import { Link, Route, Routes, useNavigate } from "react-router-dom";
import SatisfactionQuestionnaire from "./pages/SatisfactionQuestionnaire";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect, useState } from "react";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    const me = localStorage.getItem("me");

    setIsLoggedIn(!!token && !!me);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("me");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* LEFT */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-slate-900">
              Survey Form
            </Link>

            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-slate-700 hover:text-black"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <Link
                to="/login"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Admin Login
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ROUTES */}
      <Routes>
        <Route path="/" element={<SatisfactionQuestionnaire />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}