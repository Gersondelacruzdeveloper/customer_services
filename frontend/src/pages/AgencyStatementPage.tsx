import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Printer,
  Handshake,
  Search,
  Filter,
} from "lucide-react";
import { getReservations } from "../lib/api";
import { Link } from "react-router-dom";

type AgencyPortal = {
  agency_id: number;
  agency_name: string;
};

type Reservation = {
  id?: number;
  locator: string;
  lead_name: string;
  agency?: number | null;
  agency_id?: number | null;
  agency_name?: string;
  service_date: string;
  sale_total: string;
  agency_price: string;
  agency_paid: string;
  currency: string;
  status?: string;
};

function money(value: number) {
  return `USD ${value.toFixed(2)}`;
}

function getAgencyId(item: Reservation) {
  return item.agency ?? item.agency_id ?? null;
}

function getBalance(item: Reservation) {
  return Number(item.agency_price || 0) - Number(item.agency_paid || 0);
}

export default function AgencyStatementPage() {
  const [agencyPortal, setAgencyPortal] = useState<AgencyPortal | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [query, setQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const storedAgencyPortal = localStorage.getItem("agency_portal");

    if (storedAgencyPortal) {
      setAgencyPortal(JSON.parse(storedAgencyPortal));
    }

    const data = await getReservations();
    setReservations(data as Reservation[]);
  }

  const filtered = useMemo(() => {
    return reservations.filter((item) => {
      const agencyId = getAgencyId(item);

      if (!agencyPortal?.agency_id) return false;
      if (Number(agencyId) !== Number(agencyPortal.agency_id)) return false;

      const searchText = [
        item.locator,
        item.lead_name,
        item.service_date,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchText.includes(query.toLowerCase());

      const matchesMonth =
        !monthFilter || item.service_date?.slice(0, 7) === monthFilter;

      const matchesDateFrom = !dateFrom || item.service_date >= dateFrom;

      const matchesDateTo = !dateTo || item.service_date <= dateTo;

      return matchesSearch && matchesMonth && matchesDateFrom && matchesDateTo;
    });
  }, [reservations, agencyPortal, query, monthFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const totalDue = filtered.reduce(
      (sum, item) => sum + Number(item.agency_price || 0),
      0,
    );

    const paid = filtered.reduce(
      (sum, item) => sum + Number(item.agency_paid || 0),
      0,
    );

    return {
      totalReservations: filtered.length,
      totalDue,
      paid,
      remaining: totalDue - paid,
    };
  }, [filtered]);

  function clearFilters() {
    setQuery("");
    setMonthFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function handlePrint() {
    window.print();
  }


return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
            Estado de Cuenta de {agencyPortal?.agency_name || "Agencia"}
          </h2>

          <p className="text-sm text-slate-500">
            Visualiza el historial de reservas, balances y montos pendientes.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 print:hidden sm:w-auto sm:flex-row">
          <Link
            to="/agency/reservations"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700"
          >
            Reservas
          </Link>

          <Link
            to="/agency/statement"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Estado de Cuenta
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, localizador, estado..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <Filter className="h-4 w-4" />
          Limpiar
        </button>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Reservas"
        value={String(totals.totalReservations)}
        icon={<CalendarDays className="h-5 w-5" />}
      />

      <SummaryCard
        title="Total pendiente"
        value={money(totals.totalDue)}
        icon={<DollarSign className="h-5 w-5" />}
      />

      <SummaryCard
        title="Pagado"
        value={money(totals.paid)}
        icon={<Handshake className="h-5 w-5" />}
      />

      <SummaryCard
        title="Balance restante"
        value={money(totals.remaining)}
        icon={<CalendarDays className="h-5 w-5" />}
      />
    </div>

    {/* TARJETAS MÓVILES */}
    <div className="space-y-3 md:hidden">
      {filtered.map((item) => {
        const remaining = getBalance(item);

        return (
          <div
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {item.lead_name}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Localizador: {item.locator}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {item.status}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Fecha
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {item.service_date}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Total venta
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {money(Number(item.sale_total || 0))}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Total pendiente agencia
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {money(Number(item.agency_price || 0))}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Pagado por agencia
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {money(Number(item.agency_paid || 0))}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Restante
                </p>

                <p
                  className={`text-sm font-bold ${
                    remaining > 0
                      ? "text-red-700"
                      : remaining < 0
                        ? "text-blue-700"
                        : "text-green-700"
                  }`}
                >
                  {money(remaining)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No se encontraron registros en el estado de cuenta.
        </div>
      )}
    </div>

    {/* TABLA DESKTOP */}
    <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Localizador</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total venta</th>
              <th className="px-4 py-3">Total pendiente agencia</th>
              <th className="px-4 py-3">Pagado agencia</th>
              <th className="px-4 py-3">Restante</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((item) => {
              const remaining = getBalance(item);

              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.service_date}</td>
                  <td className="px-4 py-3 font-semibold">{item.locator}</td>
                  <td className="px-4 py-3">{item.lead_name}</td>

                  <td className="px-4 py-3">
                    {money(Number(item.sale_total || 0))}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {money(Number(item.agency_price || 0))}
                  </td>

                  <td className="px-4 py-3">
                    {money(Number(item.agency_paid || 0))}
                  </td>

                  <td
                    className={`px-4 py-3 font-semibold ${
                      remaining > 0
                        ? "text-red-700"
                        : remaining < 0
                          ? "text-blue-700"
                          : "text-green-700"
                    }`}
                  >
                    {money(remaining)}
                  </td>

                  <td className="px-4 py-3">{item.status}</td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No se encontraron registros en el estado de cuenta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

  
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
        {icon}
      </div>

      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-950">{value}</h3>
    </div>
  );
}
