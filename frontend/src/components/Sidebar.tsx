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
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useState } from "react";

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Sidebar({
  active,
  onChange,
  onLogout,
}: {
  active: string;
  onChange: (value: string) => void;
  onLogout: () => void;
}) {
  const [surveysOpen, setSurveysOpen] = useState(false);

  const nav = [
    ["dashboard", "Panel", LayoutDashboard],

    ["reservations", "Reservas", CalendarDays],

    ["excursions", "Excursiones", MapPinned],
    ["hotels", "Hoteles", Hotel],
    ["zones", "Zonas", Layers],
    ["pickup_times", "Horarios de Recogida", Clock],
    ["operations", "Operaciones", CheckCircle2],

    ["providers", "Proveedores", Building2],
    ["provider_services", "Servicios de Proveedores", Bus],

    ["agencies", "Agencias", Handshake],
    ["agency-prices", "Precios de Agencias", BadgeDollarSign],
    ["agency-settlement", "Liquidación de Agencias", Handshake],
    ["provider-settlement", "Liquidación de Proveedores", CreditCard],
    ["agency-access", "Acceso de Agencias", CreditCard],
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
            Reservas, hoteles, recogidas, proveedores, agencias y costos en un
            solo lugar.
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
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}

          <div>
            <button
              type="button"
              onClick={() => setSurveysOpen((prev) => !prev)}
              className={classNames(
                "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                active.startsWith("survey")
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5" />
                <span className="font-medium">Encuestas</span>
              </div>

              <ChevronDown
                className={classNames(
                  "h-4 w-4 transition-transform duration-200",
                  surveysOpen && "rotate-180",
                )}
              />
            </button>

            {surveysOpen && (
              <div className="ml-8 mt-2 space-y-1">
                <div className="ml-8 mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => onChange("survey-form")}
                    className={classNames(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                      active === "survey-form"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Formulario de Encuesta
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange("survey-results")}
                    className={classNames(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                      active === "survey-results"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Resultados de Encuestas
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange("survey-options")}
                    className={classNames(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                      active === "survey-options"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Opciones de Encuesta
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-300 transition hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}