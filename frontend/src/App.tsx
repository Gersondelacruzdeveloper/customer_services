import { Link, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SatisfactionQuestionnaire from "./pages/SatisfactionQuestionnaire";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageOptionsPage from "./pages/ManageOptionsPage";
import OperationsDashboard from "./pages/OperationsDashboard";
import { getDeviceLanguage, getText } from "./lib/i18n";
import type { SupportedLanguage } from "./lib/translations";

const languageOptions: { value: SupportedLanguage; label: string }[] = [
  { value: "en", label: "🇺🇸 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "pt", label: "🇧🇷 Português" },
  { value: "fr", label: "🇫🇷 Français" },
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "it", label: "🇮🇹 Italiano" },
  { value: "nl", label: "🇳🇱 Nederlands" },
  { value: "ru", label: "🇷🇺 Русский" },
  { value: "pl", label: "🇵🇱 Polski" },
  { value: "zh", label: "🇨🇳 中文" },
];

export default function App() {
  const [lang, setLang] = useState<SupportedLanguage>(getDeviceLanguage());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const t = useMemo(() => getText(lang), [lang]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as SupportedLanguage | null;
    if (savedLang && languageOptions.some((option) => option.value === savedLang)) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const me = localStorage.getItem("me");
    setIsLoggedIn(!!token && !!me);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("me");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-emerald-600"
            >
              {t.surveyForm}
            </Link>

            {isLoggedIn && (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  to="/dashboard"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {t.dashboard}
                </Link>

                  <Link
                  to="/questionnaire"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                 Questionario
                </Link>

                <Link
                  to="/manage-options"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {t.manageOptions}
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {!isLoggedIn ? (
              <Link
                to="/login"
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                {t.adminLogin}
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
              >
                {t.logout}
              </button>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/questionnaire" element={<SatisfactionQuestionnaire lang={lang} />} />
        <Route path="/login" element={<LoginPage  />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OperationsDashboard  />
            </ProtectedRoute>
          }
        />
          <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard  />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-options"
          element={
            <ProtectedRoute>
              <ManageOptionsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}