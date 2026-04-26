import {
  Building2,
  Bus,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  LayoutDashboard,
  MapPinned,
  UserRound,
  Hotel,
  Clock,
  Layers,
  Handshake,
  CreditCard,
} from "lucide-react";

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Sidebar({
  active,
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  const nav = [
    ["dashboard", "Dashboard", LayoutDashboard],

    ["reservations", "Reservations", CalendarDays],

    ["excursions", "Excursions", MapPinned],
    ["hotels", "Hotels", Hotel],
    ["zones", "Zones", Layers],
    ["pickup_times", "Pickup Times", Clock],

    ["providers", "Providers", Building2],
    ["provider_services", "Provider Services", Bus],

    ["agencies", "Agencies", Handshake],

    ["costs", "Costs & Profit", DollarSign],
    ["provider-payments", "Provider Payments", CreditCard],
    ["agency-payments", "Agency Payments", CreditCard],

    ["imports", "Excel Imports", FileSpreadsheet],
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white xl:block">
      <div className="flex h-full flex-col p-5">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Eco Adventures
          </p>

          <h1 className="mt-2 text-2xl font-semibold">Operations Hub</h1>

          <p className="mt-2 text-sm text-slate-400">
            Reservations, hotels, pickups, providers, agencies and costs in one place.
          </p>
        </div>

        <nav className="space-y-2 overflow-y-auto pr-1">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={classNames(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                active === key
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Daily planning ready
          </div>

          <p className="mt-2 text-emerald-50/80">
            Best next step: add CRUD screens for hotels, pickup times and provider services first.
          </p>
        </div>
      </div>
    </aside>
  );
}