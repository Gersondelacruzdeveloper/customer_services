import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  Printer,
  Handshake,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { getReservations, getAgencies } from "../lib/api";

type Agency = {
  id?: number;
  name: string;
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
  agency_balance?: string;
  currency: string;
  status?: string;
  payment_method?: string;
};

function money(value: number, currency = "USD") {
  return `${currency} ${value.toFixed(2)}`;
}

function getAgencyId(item: Reservation) {
  return item.agency ?? item.agency_id ?? null;
}

function getBalance(item: Reservation) {
  return Number(item.agency_price || 0) - Number(item.agency_paid || 0);
}

export function AgencySettlementView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);

  const [query, setQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reservationDataRaw, agencyDataRaw] = await Promise.all([
        getReservations(),
        getAgencies(),
      ]);

      setReservations(reservationDataRaw as Reservation[]);
      setAgencies(agencyDataRaw as Agency[]);
    } catch (error) {
      console.error("Error cargando datos de liquidación de agencias:", error);
      setReservations([]);
      setAgencies([]);
    }
  }

  const currencies = useMemo(() => {
    return Array.from(
      new Set(reservations.map((item) => item.currency).filter(Boolean)),
    );
  }, [reservations]);

  const filtered = useMemo(() => {
    const result = reservations.filter((item) => {
      const agencyId = getAgencyId(item);
      if (!agencyId) return false;

      const balance = getBalance(item);

      const searchText = [
        item.locator,
        item.lead_name,
        item.agency_name,
        item.service_date,
        item.currency,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchText.includes(query.toLowerCase());

      const matchesAgency =
        !agencyFilter || Number(agencyId) === Number(agencyFilter);

      const matchesMonth =
        !monthFilter || item.service_date?.slice(0, 7) === monthFilter;

      const matchesDateFrom =
        !dateFrom || item.service_date >= dateFrom;

      const matchesDateTo =
        !dateTo || item.service_date <= dateTo;

      const matchesCurrency =
        !currencyFilter || item.currency === currencyFilter;

      const matchesBalanceStatus =
        !balanceFilter ||
        (balanceFilter === "unpaid" && balance > 0) ||
        (balanceFilter === "paid" && balance === 0) ||
        (balanceFilter === "overpaid" && balance < 0);

      const matchesMinBalance =
        !minBalance || balance >= Number(minBalance);

      const matchesMaxBalance =
        !maxBalance || balance <= Number(maxBalance);

      return (
        matchesSearch &&
        matchesAgency &&
        matchesMonth &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesCurrency &&
        matchesBalanceStatus &&
        matchesMinBalance &&
        matchesMaxBalance
      );
    });

    return result.sort((a, b) => {
      const balanceA = getBalance(a);
      const balanceB = getBalance(b);

      if (sortBy === "date_asc") {
        return a.service_date.localeCompare(b.service_date);
      }

      if (sortBy === "date_desc") {
        return b.service_date.localeCompare(a.service_date);
      }

      if (sortBy === "balance_high") {
        return balanceB - balanceA;
      }

      if (sortBy === "balance_low") {
        return balanceA - balanceB;
      }

      if (sortBy === "client_asc") {
        return a.lead_name.localeCompare(b.lead_name);
      }

      return 0;
    });
  }, [
    reservations,
    query,
    agencyFilter,
    monthFilter,
    dateFrom,
    dateTo,
    currencyFilter,
    balanceFilter,
    minBalance,
    maxBalance,
    sortBy,
  ]);

  const totals = useMemo(() => {
    const agencyTotalDue = filtered.reduce(
      (sum, item) => sum + Number(item.agency_price || 0),
      0,
    );

    const agencyPaid = filtered.reduce(
      (sum, item) => sum + Number(item.agency_paid || 0),
      0,
    );

    const agencyRemaining = agencyTotalDue - agencyPaid;

    return {
      agencyTotalDue,
      agencyPaid,
      agencyRemaining,
      currency: filtered[0]?.currency || currencyFilter || "USD",
      totalReservations: filtered.length,
    };
  }, [filtered, currencyFilter]);

  function clearFilters() {
    setQuery("");
    setAgencyFilter("");
    setMonthFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrencyFilter("");
    setBalanceFilter("");
    setMinBalance("");
    setMaxBalance("");
    setSortBy("date_desc");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Liquidación de agencias
            </h2>
            <p className="text-sm text-slate-500">
              Controla balances, pagos y montos pendientes de agencias.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white print:hidden"
          >
            <Printer className="h-4 w-4" />
            Imprimir estado
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4 print:hidden">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, localizador, agencia..."
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">Todas las agencias</option>
            {agencies
              .filter((agency) => agency.id)
              .map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
          </select>

          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />

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

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">Todas las monedas</option>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>

          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">Todos los balances</option>
            <option value="unpaid">Balance pendiente</option>
            <option value="paid">Pagado completamente</option>
            <option value="overpaid">Sobrepagado</option>
          </select>

          <input
            type="number"
            value={minBalance}
            onChange={(e) => setMinBalance(e.target.value)}
            placeholder="Balance mínimo"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />

          <input
            type="number"
            value={maxBalance}
            onChange={(e) => setMaxBalance(e.target.value)}
            placeholder="Balance máximo"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
          />

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguas primero</option>
              <option value="balance_high">Mayor balance</option>
              <option value="balance_low">Menor balance</option>
              <option value="client_asc">Cliente A-Z</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Filter className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Reservas"
          value={String(totals.totalReservations)}
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <SummaryCard
          title="Total pendiente agencia"
          value={money(totals.agencyTotalDue, totals.currency)}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <SummaryCard
          title="Pagado a agencia"
          value={money(totals.agencyPaid, totals.currency)}
          icon={<Handshake className="h-5 w-5" />}
        />

        <SummaryCard
          title="Balance restante"
          value={money(totals.agencyRemaining, totals.currency)}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Localizador</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Agencia</th>
                <th className="px-4 py-3">Total venta</th>
                <th className="px-4 py-3">Total pendiente agencia</th>
                <th className="px-4 py-3">Pagado agencia</th>
                <th className="px-4 py-3">Balance restante</th>
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
                    <td className="px-4 py-3">{item.agency_name}</td>
                    <td className="px-4 py-3">
                      {money(Number(item.sale_total || 0), item.currency)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {money(Number(item.agency_price || 0), item.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {money(Number(item.agency_paid || 0), item.currency)}
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
                      {money(remaining, item.currency)}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron registros de liquidación de agencias.
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