import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SurveyRecord } from "../data/sampleSurveys";
import {
  clearSurveys,
  exportSurveysToJson,
  getSurveys,
  importSurveysFromJson,
} from "../lib/surveyStorage";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function Dashboard() {
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);

  useEffect(() => {
    setSurveys(getSurveys());
  }, []);

  const stats = useMemo(() => {
    const totalSurveys = surveys.length;
    const totalParticipants = surveys.reduce(
      (sum, survey) => sum + survey.participants,
      0
    );

    const categoryAverages = {
      punctuality: average(surveys.map((s) => s.punctuality)),
      transport: average(surveys.map((s) => s.transport)),
      guide: average(surveys.map((s) => s.guide)),
      food: average(surveys.map((s) => s.food).filter((n) => n > 0)),
    };

    const guideMap = new Map<string, number[]>();

    surveys.forEach((survey) => {
      const overall = average([
        survey.punctuality,
        survey.transport,
        survey.guide,
        survey.food > 0 ? survey.food : 0,
      ]);

      if (!guideMap.has(survey.guideName)) {
        guideMap.set(survey.guideName, []);
      }

      guideMap.get(survey.guideName)?.push(overall);
    });

    const guidePerformance = Array.from(guideMap.entries())
      .map(([name, values]) => ({
        name,
        score: Number(average(values).toFixed(2)),
        total: values.length,
      }))
      .sort((a, b) => b.score - a.score);

    const hotelMap = new Map<string, number>();
    surveys.forEach((survey) => {
      hotelMap.set(survey.hotel, (hotelMap.get(survey.hotel) || 0) + 1);
    });

    const hotelCounts = Array.from(hotelMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const excursionMap = new Map<string, number>();
    surveys.forEach((survey) => {
      excursionMap.set(
        survey.excursion,
        (excursionMap.get(survey.excursion) || 0) + 1
      );
    });

    const excursionCounts = Array.from(excursionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const happiestGuide = guidePerformance[0] || null;
    const topHotel = hotelCounts[0] || null;

    const comments = surveys
      .map((s) => ({
        comment: s.comments,
        clientName: s.clientName,
        hotel: s.hotel,
      }))
      .filter((item) => item.comment?.trim())
      .slice(-5)
      .reverse();

    return {
      totalSurveys,
      totalParticipants,
      categoryAverages,
      guidePerformance,
      hotelCounts,
      excursionCounts,
      happiestGuide,
      topHotel,
      comments,
    };
  }, [surveys]);

  const handleExport = () => {
    exportSurveysToJson();
  };

  const handleReset = () => {
    clearSurveys();
    setSurveys(getSurveys());
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importSurveysFromJson(file);
    setSurveys(getSurveys());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Top Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                <img
                  src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
                  alt="Eco Adventures logo"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  Eco Adventures
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Customer Insights Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track guide performance, hotel volume, excursion demand, and
                  customer satisfaction.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Export JSON
              </button>

              <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleReset}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Reset Sample Data
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Surveys"
            value={stats.totalSurveys}
            accent="from-emerald-500/20 to-emerald-100"
          />
          <StatCard
            title="Total Participants"
            value={stats.totalParticipants}
            accent="from-sky-500/20 to-sky-100"
          />
          <StatCard
            title="Best Guide"
            value={stats.happiestGuide?.name || "-"}
            subtitle={
              stats.happiestGuide
                ? `Average score ${stats.happiestGuide.score} / 4`
                : undefined
            }
            accent="from-amber-500/20 to-amber-100"
          />
          <StatCard
            title="Top Hotel"
            value={stats.topHotel?.name || "-"}
            subtitle={
              stats.topHotel ? `${stats.topHotel.value} surveys received` : undefined
            }
            accent="from-violet-500/20 to-violet-100"
          />
        </div>

        {/* Main charts */}
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title="Guide Performance"
            subtitle="Average satisfaction score by guide"
          >
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

          <ChartCard
            title="Customers by Hotel"
            subtitle="Which hotels send the most customers"
          >
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

        {/* Secondary section */}
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            title="Popular Excursions"
            subtitle="Top booked experiences"
            className="xl:col-span-2"
          >
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

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Category Averages
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                See which service areas are strongest.
              </p>
            </div>

            <div className="space-y-4">
              <AverageRow
                label="Punctuality"
                value={stats.categoryAverages.punctuality}
              />
              <AverageRow
                label="Transport"
                value={stats.categoryAverages.transport}
              />
              <AverageRow
                label="Guide"
                value={stats.categoryAverages.guide}
              />
              <AverageRow
                label="Food"
                value={stats.categoryAverages.food}
              />
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Guide Ranking
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ranked by average survey score
                </p>
              </div>
            </div>

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
                        {guide.total} survey{guide.total !== 1 ? "s" : ""}
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

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/40">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Comments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest feedback from customers
              </p>
            </div>

            <div className="space-y-3">
              {stats.comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                  No comments yet.
                </div>
              ) : (
                stats.comments.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4"
                  >
                    <p className="text-sm leading-6 text-slate-700">
                      {item.comment}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.clientName && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                          {item.clientName}
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
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/40">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent || "from-slate-200 to-slate-100"}`}
      />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-lg shadow-slate-200/40 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
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
        <span className="font-semibold text-slate-900">
          {value.toFixed(2)} / 4
        </span>
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