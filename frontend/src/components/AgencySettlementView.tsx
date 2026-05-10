import { useEffect, useMemo, useState } from "react";
import { CalendarDays, DollarSign, Printer, Handshake } from "lucide-react";
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
};

function money(value: number, currency = "USD") {
  return `${currency} ${value.toFixed(2)}`;
}

function getAgencyId(item: Reservation) {
  return item.agency ?? item.agency_id ?? null;
}

export function AgencySettlementView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyFilter, setAgencyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reservationDataRaw, agencyDataRaw] = await Promise.all([
        getReservations(),
        getAgencies(),
      ]);

      setReservations(Array.isArray(reservationDataRaw) ? reservationDataRaw : []);
      setAgencies(Array.isArray(agencyDataRaw) ? agencyDataRaw : []);
    } catch (error) {
      console.error("Error loading agency settlement data:", error);
      setReservations([]);
      setAgencies([]);
    }
  }

  const filtered = useMemo(() => {
    return reservations.filter((item) => {
      const agencyId = getAgencyId(item);
      if (!agencyId) return false;

      const matchesAgency =
        !agencyFilter || Number(agencyId) === Number(agencyFilter);

      const matchesMonth =
        !monthFilter || item.service_date?.slice(0, 7) === monthFilter;

      return matchesAgency && matchesMonth;
    });
  }, [reservations, agencyFilter, monthFilter]);

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
      currency: filtered[0]?.currency || "USD",
    };
  }, [filtered]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Agency Settlement
            </h2>
            <p className="text-sm text-slate-500">
              Track how much agencies need to pay you.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white print:hidden"
          >
            <Printer className="h-4 w-4" />
            Print statement
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 print:hidden">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Agency</label>
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              <option value="">All agencies</option>
              {agencies
                .filter((agency) => agency.id)
                .map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setAgencyFilter("");
                setMonthFilter("");
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Agency total due"
          value={money(totals.agencyTotalDue, totals.currency)}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <SummaryCard
          title="Agency paid"
          value={money(totals.agencyPaid, totals.currency)}
          icon={<Handshake className="h-5 w-5" />}
        />

        <SummaryCard
          title="Remaining balance"
          value={money(totals.agencyRemaining, totals.currency)}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Locator</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Sale total</th>
              <th className="px-4 py-3">Agency total due</th>
              <th className="px-4 py-3">Agency paid</th>
              <th className="px-4 py-3">Remaining balance</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((item) => {
              const remaining =
                Number(item.agency_price || 0) - Number(item.agency_paid || 0);

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
                  <td className="px-4 py-3 font-semibold text-red-700">
                    {money(remaining, item.currency)}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No agency settlement records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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