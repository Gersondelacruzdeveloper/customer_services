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
  BadgeDollarSign,
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
    ["operations", "Operations", CheckCircle2],

    ["providers", "Providers", Building2],
    ["provider_services", "Provider Services", Bus],

    ["agencies", "Agencies", Handshake],
    ["agency-prices", "Agency Prices", BadgeDollarSign],
    ["agency-settlement", "Agency Settlement", Handshake],
    ["provider-settlement", "Provider Settlement", CreditCard],

    ["provider-payments", "Provider Payments", CreditCard],

    ["surveys", "Surveys", UserRound],
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white xl:block">
      <div className="flex h-full flex-col p-5">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <img
              src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
              alt="Eco Adventures"
              className="rounded-xl object-cover"
            />
      
          </div>

          <p className="mt-3 text-sm text-slate-400">
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

      </div>
    </aside>
  );
}