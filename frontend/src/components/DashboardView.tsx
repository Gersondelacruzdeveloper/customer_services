import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  Users,
  MapPinned,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { getReservations, getOperations } from "../lib/api";

type Reservation = {
  id?: number;
  excursion?: number;
  excursion_id?: number;
  excursion_name?: string;
  service_date: string;
  sale_total: string;
  paid_amount?: string;
  adults: number;
  children: number;
  infants: number;
  status: string;
  currency: string;
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
  excursion_name?: string;
  provider_service_cost?: string;
  provider_service_price_type?: string;
  reservations?: OperationReservation[];
};

function money(value: number, currency = "USD") {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function todayString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function getMonthKey(dateString: string) {
  return dateString?.slice(0, 7);
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function getPax(item: Reservation) {
  return (
    Number(item.adults || 0) +
    Number(item.children || 0) +
    Number(item.infants || 0)
  );
}

function calculateOperationCost(operation: Operation) {
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

export function DashboardView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [reservationData, operationData] = await Promise.all([
        getReservations() as Promise<Reservation[]>,
        getOperations() as Promise<Operation[]>,
      ]);

      setReservations(reservationData);
      setOperations(operationData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const today = todayString(0);
    const tomorrow = todayString(1);
    const currentMonth = getCurrentMonthKey();

    const validReservations = reservations.filter(
      (item) => item.status !== "cancelled" && item.status !== "no_show",
    );

    const todayReservations = validReservations.filter(
      (item) => item.service_date === today,
    );

    const tomorrowReservations = validReservations.filter(
      (item) => item.service_date === tomorrow,
    );

    const thisMonthReservations = validReservations.filter(
      (item) => getMonthKey(item.service_date) === currentMonth,
    );

    const totalRevenue = validReservations.reduce(
      (sum, item) => sum + Number(item.sale_total || 0),
      0,
    );

    const thisMonthRevenue = thisMonthReservations.reduce(
      (sum, item) => sum + Number(item.sale_total || 0),
      0,
    );

    const todayRevenue = todayReservations.reduce(
      (sum, item) => sum + Number(item.sale_total || 0),
      0,
    );

    const tomorrowRevenue = tomorrowReservations.reduce(
      (sum, item) => sum + Number(item.sale_total || 0),
      0,
    );

    const totalPaxThisMonth = thisMonthReservations.reduce(
      (sum, item) => sum + getPax(item),
      0,
    );

    const todayExcursionCount = todayReservations.length;
    const tomorrowExcursionCount = tomorrowReservations.length;

    const dayOfMonth = new Date().getDate();
    const averagePerDay = thisMonthRevenue / Math.max(dayOfMonth, 1);

    const nextMonthProjection = averagePerDay * 30;

    const expenseTotal = operations.reduce((sum, operation) => {
      return sum + calculateOperationCost(operation);
    }, 0);
    const profit = totalRevenue - expenseTotal;

    return {
      todayExcursionCount,
      tomorrowExcursionCount,
      totalRevenue,
      thisMonthRevenue,
      todayRevenue,
      tomorrowRevenue,
      totalPaxThisMonth,
      averagePerDay,
      nextMonthProjection,
      expenseTotal,
      profit,
    };
  }, [reservations, operations]);

  const revenueByExcursion = useMemo(() => {
    const map = new Map<string, number>();

    reservations
      .filter(
        (item) => item.status !== "cancelled" && item.status !== "no_show",
      )
      .forEach((item) => {
        const name = item.excursion_name || "Unknown";
        map.set(name, (map.get(name) || 0) + Number(item.sale_total || 0));
      });

    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [reservations]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();

    reservations
      .filter(
        (item) => item.status !== "cancelled" && item.status !== "no_show",
      )
      .forEach((item) => {
        const month = getMonthKey(item.service_date);
        if (!month) return;

        map.set(month, (map.get(month) || 0) + Number(item.sale_total || 0));
      });

    return Array.from(map.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [reservations]);

  const paxByExcursion = useMemo(() => {
    const map = new Map<string, number>();

    reservations
      .filter(
        (item) => item.status !== "cancelled" && item.status !== "no_show",
      )
      .forEach((item) => {
        const name = item.excursion_name || "Unknown";
        map.set(name, (map.get(name) || 0) + getPax(item));
      });

    return Array.from(map.entries())
      .map(([name, pax]) => ({ name, pax }))
      .sort((a, b) => b.pax - a.pax)
      .slice(0, 6);
  }, [reservations]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Panel</h2>
            <p className="text-sm text-slate-500">
              Ingresos, gastos, rendimiento de excursiones y proyección mensual.
            </p>
          </div>

          <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {loading ? "Cargando...." : "Datos en vivo"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Excursiones de hoy"
          value={stats.todayExcursionCount}
          subtitle={money(stats.todayRevenue)}
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <StatCard
          title="Excursiones de mañana"
          value={stats.tomorrowExcursionCount}
          subtitle={money(stats.tomorrowRevenue)}
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          title="Generado este mes"
          value={money(stats.thisMonthRevenue)}
          subtitle={`${stats.totalPaxThisMonth} pax este mes`}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <StatCard
          title="Proyección próximo mes"
          value={money(stats.nextMonthProjection)}
          subtitle={`Promedio/día: ${money(stats.averagePerDay)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Ingresos totales"
          value={money(stats.totalRevenue)}
          subtitle="From reservation sale totals"
          icon={<DollarSign className="h-5 w-5" />}
        />

        <StatCard
          title="Gastos estimados"
          value={money(stats.expenseTotal)}
          subtitle="From assigned provider service costs"
          icon={<MapPinned className="h-5 w-5" />}
        />

        <StatCard
          title="Ganancia estimada"
          value={money(stats.profit)}
          subtitle="Ingresos menos gastos estimados"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Ingresos mensuales">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyRevenue}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Line type="monotone" dataKey="revenue" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mejores excursiones por ingresos">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={revenueByExcursion}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Bar dataKey="revenue" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Mejores excursiones por pasajeros">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={paxByExcursion}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pax" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Participación de ingresos por excursiónn">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={revenueByExcursion}
                dataKey="revenue"
                nameKey="name"
                outerRadius={115}
                label
              >
                {revenueByExcursion.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => money(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Excursiones con mejor rendimiento
        </h3>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Excursión</th>
                <th className="px-4 py-3">Ingresos</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {revenueByExcursion.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">{money(item.revenue)}</td>
                </tr>
              ))}

              {revenueByExcursion.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aún no hay datos de ingresos.
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-950">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}
