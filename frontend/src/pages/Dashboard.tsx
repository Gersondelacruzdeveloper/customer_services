import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardStats, type DashboardStats } from "../lib/api";


export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      setError("Falta el token de inicio de sesión.");
      setLoading(false);
      return;
    }

    getDashboardStats(token)
      .then((data) => {
        setStats(data);
      })
      .catch(() => {
        setError("Error al cargar el panel.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Cargando panel...</div>;
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-red-600">
        {error || "No hay datos disponibles."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
                <img
                  src={Logo}
                  alt="Eco Adventures logo"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  Eco Adventures
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Panel de análisis de clientes
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Rendimiento de guías, volumen de hoteles, demanda de excursiones y satisfacción del cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total de encuestas" value={stats.totalSurveys} />
          <StatCard title="Total de participantes" value={stats.totalParticipants} />
          <StatCard
            title="Mejor guía"
            value={stats.happiestGuide?.name || "-"}
            subtitle={
              stats.happiestGuide
                ? `Promedio ${stats.happiestGuide.score} / 4`
                : undefined
            }
          />
          <StatCard
            title="Hotel destacado"
            value={stats.topHotel?.name || "-"}
            subtitle={
              stats.topHotel
                ? `${stats.topHotel.value} encuestas recibidas`
                : undefined
            }
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard title="Rendimiento de guías">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.guidePerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 4]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="score" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Clientes por hotel">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.hotelCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard title="Excursiones populares" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.excursionCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Promedios por categoría
            </h2>

            <div className="space-y-4">
              <AverageRow label="Puntualidad" value={stats.categoryAverages.punctuality} />
              <AverageRow label="Transporte" value={stats.categoryAverages.transport} />
              <AverageRow label="Guía" value={stats.categoryAverages.guide} />
              <AverageRow label="Comida" value={stats.categoryAverages.food} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Ranking de guías
            </h2>

            <div className="space-y-3">
              {stats.guidePerformance.map((guide, index) => (
                <div
                  key={guide.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">{guide.name}</p>
                      <p className="text-sm text-slate-500">
                        {guide.total} {guide.total !== 1 ? "encuestas" : "encuesta"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {guide.score} / 4
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Comentarios recientes
            </h2>

            <div className="space-y-3">
              {stats.comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                  Aún no hay comentarios.
                </div>
              ) : (
                stats.comments.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4"
                  >
                    <p className="text-sm leading-6 text-slate-700">
                      {item.comments}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.client_name && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                          {item.client_name}
                        </span>
                      )}
                      {item.hotel && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                          {item.hotel}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg ${className}`}>
      <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function AverageRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const percent = Math.max(0, Math.min((value / 4) * 100, 100));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value.toFixed(2)} / 4</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}