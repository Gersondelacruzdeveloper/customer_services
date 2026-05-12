import {
  Link,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import SatisfactionQuestionnaire from "./pages/SatisfactionQuestionnaire";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageOptionsPage from "./pages/ManageOptionsPage";
import OperationsDashboard from "./pages/OperationsDashboard";
import AgencyLoginPage from "./pages/AgencyLoginPage";
import AgencyReservationsPage from "./pages/AgencyReservationsPage";
import AgencyStatementPage from "./pages/AgencyStatementPage";

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
  const [isAgencyLoggedIn, setIsAgencyLoggedIn] = useState(false);

  const t = useMemo(() => getText(lang), [lang]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as SupportedLanguage | null;

    if (
      savedLang &&
      languageOptions.some((option) => option.value === savedLang)
    ) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const me = localStorage.getItem("me");
    const agencyPortal = localStorage.getItem("agency_portal");

    setIsLoggedIn(!!token && !!me);
    setIsAgencyLoggedIn(!!token && !!agencyPortal);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("me");
    localStorage.removeItem("agency_portal");

    setIsLoggedIn(false);
    setIsAgencyLoggedIn(false);

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <Routes>
        <Route path="/agency/login" element={<AgencyLoginPage />} />
        <Route path="/agency/reservations" element={<AgencyReservationsPage />} />
        <Route path="/agency/statement" element={<AgencyStatementPage />} />

        <Route
          path="/questionnaire"
          element={<SatisfactionQuestionnaire lang={lang} />}
        />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OperationsDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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