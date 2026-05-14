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
import { getOperations, getProviders } from "../lib/api";

type Provider = {
  id?: number;
  name: string;
};

type OperationReservation = {
  id?: number;
  adults?: number;
  children?: number;
  infants?: number;
};

type Operation = {
  id?: number;
  date: string;
  provider?: number | null;
  provider_id?: number | null;
  provider_name?: string;
  provider_service_name?: string;
  provider_service_cost?: string;
  provider_service_price_type?: string;
  provider_service_currency?: string;
  status?: string;
  reservations?: OperationReservation[];
  provider_paid?: string;
};

function money(value: number, currency = "USD") {
  return `${currency} ${value.toFixed(2)}`;
}

function getProviderId(item: Operation) {
  return item.provider ?? item.provider_id ?? null;
}

function getProviderTotal(operation: Operation) {
  const cost = Number(operation.provider_service_cost || 0);

  const priceType = operation.provider_service_price_type || "fixed";

  const pax =
    operation.reservations?.reduce(
      (total, reservation) =>
        total +
        Number(reservation.adults || 0) +
        Number(reservation.children || 0) +
        Number(reservation.infants || 0),
      0,
    ) || 0;

  if (priceType === "per_person") {
    return cost * pax;
  }

  return cost;
}

function getProviderPaid(item: Operation) {
  return Number(item.provider_paid || 0);
}

function getProviderBalance(item: Operation) {
  return getProviderTotal(item) - getProviderPaid(item);
}

export function ProviderSettlementView() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [operationDataRaw, providerDataRaw] = await Promise.all([
        getOperations(),
        getProviders(),
      ]);

      setOperations(operationDataRaw as Operation[]);
      setProviders(providerDataRaw as Provider[]);
    } catch (error) {
      console.error("Error cargando datos de liquidación de proveedores:", error);
      setOperations([]);
      setProviders([]);
    }
  }

  const filtered = useMemo(() => {
    const result = operations.filter((item) => {
      const providerId = getProviderId(item);
      if (!providerId) return false;

      const balance = getProviderBalance(item);

      const searchText = [
        item.provider_name,
        item.provider_service_name,
        item.date,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchText.includes(query.toLowerCase());

      const matchesProvider =
        !providerFilter || Number(providerId) === Number(providerFilter);

      const matchesMonth =
        !monthFilter || item.date?.slice(0, 7) === monthFilter;

      const matchesDateFrom = !dateFrom || item.date >= dateFrom;

      const matchesDateTo = !dateTo || item.date <= dateTo;

      const matchesStatus =
        !statusFilter || item.status === statusFilter;

      const matchesBalance =
        !balanceFilter ||
        (balanceFilter === "unpaid" && balance > 0) ||
        (balanceFilter === "paid" && balance === 0) ||
        (balanceFilter === "overpaid" && balance < 0);

      return (
        matchesSearch &&
        matchesProvider &&
        matchesMonth &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesStatus &&
        matchesBalance
      );
    });

    return result.sort((a, b) => {
      const balanceA = getProviderBalance(a);
      const balanceB = getProviderBalance(b);

      if (sortBy === "date_asc") return a.date.localeCompare(b.date);
      if (sortBy === "date_desc") return b.date.localeCompare(a.date);
      if (sortBy === "balance_high") return balanceB - balanceA;
      if (sortBy === "balance_low") return balanceA - balanceB;

      if (sortBy === "provider_asc") {
        return String(a.provider_name || "").localeCompare(
          String(b.provider_name || ""),
        );
      }

      return 0;
    });
  }, [
    operations,
    query,
    providerFilter,
    monthFilter,
    dateFrom,
    dateTo,
    statusFilter,
    balanceFilter,
    sortBy,
  ]);

  const totals = useMemo(() => {
    const providerTotalDue = filtered.reduce(
      (sum, item) => sum + getProviderTotal(item),
      0,
    );

    const providerPaid = filtered.reduce(
      (sum, item) => sum + getProviderPaid(item),
      0,
    );

    const providerRemaining = providerTotalDue - providerPaid;

    return {
      totalOperations: filtered.length,
      providerTotalDue,
      providerPaid,
      providerRemaining,
      currency: filtered[0]?.provider_service_currency || "USD",
    };
  }, [filtered]);

  function clearFilters() {
    setQuery("");
    setProviderFilter("");
    setMonthFilter("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
    setBalanceFilter("");
    setSortBy("date_desc");
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
            Liquidación de proveedores
          </h2>

          <p className="text-sm text-slate-500">
            Lleva el control de cuánto debes a los proveedores por operaciones
            asignadas.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white print:hidden sm:w-auto"
        >
          <Printer className="h-4 w-4" />
          Imprimir estado
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proveedor, servicio, estado..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="">Todos los proveedores</option>

          {providers
            .filter((provider) => provider.id)
            .map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
        </select>

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />

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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviado al proveedor</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="">Todos los balances</option>
          <option value="unpaid">Aún debemos</option>
          <option value="paid">Pagado completamente</option>
          <option value="overpaid">Pagado de más</option>
        </select>

        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm"
          >
            <option value="date_desc">Más recientes primero</option>
            <option value="date_asc">Más antiguos primero</option>
            <option value="balance_high">Mayor balance</option>
            <option value="balance_low">Menor balance</option>
            <option value="provider_asc">Proveedor A-Z</option>
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <Filter className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>
    </div>

    {/* SUMMARY */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Operaciones"
        value={String(totals.totalOperations)}
        icon={<CalendarDays className="h-5 w-5" />}
      />

      <SummaryCard
        title="Total a pagar"
        value={money(totals.providerTotalDue, totals.currency)}
        icon={<DollarSign className="h-5 w-5" />}
      />

      <SummaryCard
        title="Pagado al proveedor"
        value={money(totals.providerPaid, totals.currency)}
        icon={<Handshake className="h-5 w-5" />}
      />

      <SummaryCard
        title="Aún debemos"
        value={money(totals.providerRemaining, totals.currency)}
        icon={<CalendarDays className="h-5 w-5" />}
      />
    </div>

    {/* MOBILE CARDS */}
    <div className="space-y-3 md:hidden">
      {filtered.map((item) => {
        const currency =
          item.provider_service_currency || "USD";

        const cost = Number(
          item.provider_service_cost || 0,
        );

        const priceType =
          item.provider_service_price_type || "fixed";

        const pax =
          item.reservations?.reduce(
            (total, reservation) =>
              total +
              Number(reservation.adults || 0) +
              Number(reservation.children || 0) +
              Number(reservation.infants || 0),
            0,
          ) || 0;

        const total = getProviderTotal(item);
        const paid = getProviderPaid(item);
        const balance = getProviderBalance(item);

        return (
          <div
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {item.provider_name || "—"}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  {item.provider_service_name || "—"}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {item.date}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Estado</p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {item.status || "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Pax</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {pax}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Costo</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {money(cost, currency)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Tipo de precio
                </p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {priceType.replace(/_/g, " ")}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Total a pagar
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {money(total, currency)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Pagado</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {money(paid, currency)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Balance</p>

              <p
                className={`mt-1 text-sm font-bold ${
                  balance > 0
                    ? "text-red-700"
                    : balance < 0
                      ? "text-blue-700"
                      : "text-green-700"
                }`}
              >
                {money(balance, currency)}
              </p>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No se encontraron registros de liquidación de proveedores.
        </div>
      )}
    </div>

    {/* DESKTOP TABLE */}
    <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Tipo de precio</th>
              <th className="px-4 py-3">Total a pagar</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((item) => {
              const currency =
                item.provider_service_currency || "USD";

              const cost = Number(
                item.provider_service_cost || 0,
              );

              const priceType =
                item.provider_service_price_type || "fixed";

              const pax =
                item.reservations?.reduce(
                  (total, reservation) =>
                    total +
                    Number(reservation.adults || 0) +
                    Number(reservation.children || 0) +
                    Number(reservation.infants || 0),
                  0,
                ) || 0;

              const total = getProviderTotal(item);
              const paid = getProviderPaid(item);
              const balance = getProviderBalance(item);

              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.date}</td>

                  <td className="px-4 py-3 font-semibold">
                    {item.provider_name || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {item.provider_service_name || "—"}
                  </td>

                  <td className="px-4 py-3 capitalize">
                    {item.status || "—"}
                  </td>

                  <td className="px-4 py-3">{pax}</td>

                  <td className="px-4 py-3">
                    {money(cost, currency)}
                  </td>

                  <td className="px-4 py-3 capitalize">
                    {priceType.replace(/_/g, " ")}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {money(total, currency)}
                  </td>

                  <td className="px-4 py-3">
                    {money(paid, currency)}
                  </td>

                  <td
                    className={`px-4 py-3 font-semibold ${
                      balance > 0
                        ? "text-red-700"
                        : balance < 0
                          ? "text-blue-700"
                          : "text-green-700"
                    }`}
                  >
                    {money(balance, currency)}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No se encontraron registros de liquidación de proveedores.
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

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h3 className="mt-1 text-2xl font-bold text-slate-950">
        {value}
      </h3>
    </div>
  );
}