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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {agencyPortal?.agency_name || "Agency"} Statement
            </h2>

            <p className="text-sm text-slate-500">
              View your reservation history, balances, and pending amounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <Link
              to="/agency/reservations"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Reservations
            </Link>

            <Link
              to="/agency/statement"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Statement
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4 print:hidden">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search client, locator, status..."
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Reservations"
          value={String(totals.totalReservations)}
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <SummaryCard
          title="Total due"
          value={money(totals.totalDue)}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <SummaryCard
          title="Paid"
          value={money(totals.paid)}
          icon={<Handshake className="h-5 w-5" />}
        />

        <SummaryCard
          title="Remaining balance"
          value={money(totals.remaining)}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Locator</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Sale total</th>
                <th className="px-4 py-3">Agency total due</th>
                <th className="px-4 py-3">Agency paid</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Status</th>
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
                    No statement records found.
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
