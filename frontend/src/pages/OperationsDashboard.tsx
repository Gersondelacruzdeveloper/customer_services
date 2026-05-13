import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getDeviceLanguage } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/translations";
import { ReservationsView } from "@/components/ReservationsView";
import { ZonesView } from "@/components/ZonesView";
import { PickupTimesView } from "@/components/PickupTimesView";
import { HotelsView } from "@/components/HotelsView";
import { ExcursionsView } from "@/components/ExcursionsView";
import { ProvidersView } from "@/components/ProvidersView";
import { ProviderServicesView } from "@/components/ProviderServicesView";
import { AgenciesView } from "@/components/AgenciesView";
import { OperationsView } from "@/components/OperationsView";
import { AgencyExcursionPricesView } from "@/components/AgencyExcursionPricesView";
import { DashboardView } from "@/components/DashboardView";
import { AgencySettlementView } from "@/components/AgencySettlementView";
import { ProviderSettlementView } from "@/components/ProviderSettlementView";
import { AgencyAccessView } from "@/components/AgencyAccessView";
import SatisfactionQuestionnaire from "./SatisfactionQuestionnaire";
import SurveyResultsDashboard from "./SurveyResultsDashboard";
import ManageOptionsPage from "./ManageOptionsPage";

function CostsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Costs & Profit</h3>
        <p className="mt-1 text-sm text-slate-500">
          Costs and profit reports will go here.
        </p>
      </div>
    </div>
  );
}

function ProviderPaymentsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Provider Payments
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Provider payment tracking will go here.
        </p>
      </div>
    </div>
  );
}

function ExcelImportsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Excel Imports</h3>
        <p className="mt-1 text-sm text-slate-500">
          Excel import history will go here.
        </p>
      </div>
    </div>
  );
}

export default function EcoAdventuresOperationsDashboard() {

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

  const [active, setActive] = useState("dashboard");
  const [lang, setLang] = useState<SupportedLanguage>(getDeviceLanguage());
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("me");
    localStorage.removeItem("agency_portal");

    navigate("/login");
  }

  const content = (() => {
    switch (active) {
      case "dashboard":
        return <DashboardView />;

      case "reservations":
        return <ReservationsView />;

      case "excursions":
        return <ExcursionsView />;

      case "hotels":
        return <HotelsView />;

      case "zones":
        return <ZonesView />;

      case "pickup_times":
        return <PickupTimesView />;

      case "providers":
        return <ProvidersView />;

      case "provider_services":
        return <ProviderServicesView />;

      case "agencies":
        return <AgenciesView />;

      case "costs":
        return <CostsView />;

      case "provider-payments":
        return <ProviderPaymentsView />;

      case "excel-imports":
        return <ExcelImportsView />;

      case "operations":
        return <OperationsView />;

      case "agency-prices":
        return <AgencyExcursionPricesView />;

      case "agency-settlement":
        return <AgencySettlementView />;

      case "provider-settlement":
        return <ProviderSettlementView />;

      case "agency-access":
        return <AgencyAccessView />;
      case "survey-form":
        return <SatisfactionQuestionnaire lang={lang} setLang={setLang} />;

      case "survey-results":
        return (
          <SurveyResultsDashboard />
        );

      case "survey-options":
        return <ManageOptionsPage />;

      default:
        return <DashboardView />;
    }
  })();
return (
  <div className="min-h-screen bg-slate-100 text-slate-900">
    <div className="flex">
      <Sidebar
        active={active}
        onChange={(value) => {
          setActive(value);
          setSidebarOpen(false);
        }}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="m-4 rounded-xl bg-slate-950 px-4 py-2 text-white xl:hidden"
        >
          Menu
        </button>

        <main className="min-w-0">{content}</main>
      </div>
    </div>
  </div>
);


}
