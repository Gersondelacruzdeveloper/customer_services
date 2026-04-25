import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Bus,
  MapPinned,
  Users,
  Languages,
  DollarSign,
  FileSpreadsheet,
  Route,
  CalendarDays,
  UserRound,
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  TrendingUp,
  Upload,
  Filter,
  Plus,
  ChevronRight,
  Wallet,
  ReceiptText,
} from "lucide-react";
import "../types/types";
import { excursions } from "../data/excursions";
import { hotels } from "../data/hotels";
import { vehicles } from "../data/Vehicle";
import { guides } from "../data/TourGuide";
import { providers } from "../data/Provider";
import { reservations } from "../data/Reservation";
import { imports } from "../data/imports";
import { assignments } from "../data/assignments";
import Sidebar from "../components/Sidebar";
import { getExcursionById, getHotelById, getVehicleById, getGuideById, getProviderName, totalPax, recommendVehicles, recommendedGuideForLanguages, classNames } from "../lib/utils";
import type {Hotel } from "../types/types";
import DashboardCard from "../components/DashboardCard";
import { ReservationsView } from "@/components/ReservationsView";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function groupReservationsByExcursion(date: string) {
  const dayReservations = reservations.filter((r) => r.serviceDate === date);
  return excursions
    .map((excursion) => {
      const items = dayReservations.filter((r) => r.excursionId === excursion.id);
      const pax = items.reduce((sum, r) => sum + totalPax(r), 0);
      const languages = items.flatMap((r) => Array(totalPax(r)).fill(r.language));
      return {
        excursion,
        items,
        pax,
        languages,
        suggestedVehicles: recommendVehicles(pax, vehicles),
        suggestedGuide: recommendedGuideForLanguages(languages, guides),
      };
    })
    .filter((item) => item.items.length > 0);
}

function buildHotelPickupSummary(date: string) {
  const dayReservations = reservations.filter((r) => r.serviceDate === date);
  const map = new Map<
    string,
    {
      hotel: Hotel;
      total: number;
      byExcursion: Record<string, number>;
      earliestPickup: string;
    }
  >();

  dayReservations.forEach((reservation) => {
    const hotel = getHotelById(reservation.hotelId, hotels);
    if (!hotel) return;

    const existing = map.get(hotel.id) ?? {
      hotel,
      total: 0,
      byExcursion: {} as Record<string, number>,
      earliestPickup: reservation.pickupTime,
    };

    existing.total += totalPax(reservation);
    const excursionId = reservation.excursionId as string;
    existing.byExcursion[excursionId] =
      (existing.byExcursion[excursionId] ?? 0) + totalPax(reservation);

    if (reservation.pickupTime < existing.earliestPickup) {
      existing.earliestPickup = reservation.pickupTime;
    }

    map.set(hotel.id, existing);
  });

  return [...map.values()].sort((a, b) => a.earliestPickup.localeCompare(b.earliestPickup));
}



function Topbar({ active }: { active: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Operations</p>
          <h2 className="text-2xl font-semibold capitalize tracking-tight text-slate-900">{active.replace("_", " ")}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72"
              placeholder="Search reservation, hotel, provider..."
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            New reservation
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const selectedDate = "2026-04-21";
  const dayReservations = reservations.filter((r) => r.serviceDate === selectedDate);
  const totalRevenueProjection = dayReservations.reduce((sum, reservation) => {
    const excursion = getExcursionById(reservation.excursionId, excursions);
    const fallback = excursion?.providerOptions[0]?.defaultPrice ?? 0;
    const unitPrice = reservation.providerPriceOverride ?? fallback;
    return sum + unitPrice * totalPax(reservation);
  }, 0);

  const totalAssignedCost = assignments
    .filter((a) => a.serviceDate === selectedDate)
    .reduce((sum, a) => sum + a.estimatedCost, 0);

  const hotelSummary = buildHotelPickupSummary(selectedDate);
  const grouped = groupReservationsByExcursion(selectedDate);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Reservations today" value={String(dayReservations.length)} subtitle="Imported + manual bookings" icon={ReceiptText} />
        <DashboardCard title="Tourists today" value={String(dayReservations.reduce((sum, r) => sum + totalPax(r), 0))} subtitle="Adults and children combined" icon={Users} />
        <DashboardCard title="Projected revenue" value={currency.format(totalRevenueProjection)} subtitle="Based on selected provider prices" icon={TrendingUp} />
        <DashboardCard title="Assigned operating cost" value={currency.format(totalAssignedCost)} subtitle="Vehicles + guide estimated cost" icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.25fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Excursion dispatch planner</h3>
              <p className="text-sm text-slate-500">Suggested vehicle and guide based on passenger count and spoken languages.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4" />
              Filter date
            </button>
          </div>

          <div className="space-y-4">
            {grouped.map(({ excursion, pax, items, suggestedVehicles, suggestedGuide }) => {
              const topVehicle = suggestedVehicles[0];
              return (
                <div key={excursion.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-slate-900">{excursion.name}</h4>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {pax} pax
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Start {excursion.defaultStartTime}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Meeting point: {excursion.meetingPoint}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Suggested vehicle</p>
                        <p className="mt-1 font-semibold text-slate-900">{topVehicle ? topVehicle.name : "No vehicle available"}</p>
                        <p className="text-sm text-slate-500">
                          {topVehicle ? `${topVehicle.capacity} seats · ${currency.format(topVehicle.costPerService)}` : "Create more vehicle options"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Suggested guide</p>
                        <p className="mt-1 font-semibold text-slate-900">{suggestedGuide?.name ?? "No guide match"}</p>
                        <p className="text-sm text-slate-500">{suggestedGuide ? `${suggestedGuide.languages.join(", ")} · ${currency.format(suggestedGuide.dailyRate)}` : "Add guide languages"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-4 font-medium">Locator</th>
                          <th className="py-2 pr-4 font-medium">Lead client</th>
                          <th className="py-2 pr-4 font-medium">Hotel</th>
                          <th className="py-2 pr-4 font-medium">Pickup</th>
                          <th className="py-2 pr-4 font-medium">Pax</th>
                          <th className="py-2 pr-4 font-medium">Language</th>
                          <th className="py-2 pr-4 font-medium">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 pr-4 font-medium text-slate-900">{item.locator}</td>
                            <td className="py-3 pr-4">{item.leadName}</td>
                            <td className="py-3 pr-4">{getHotelById(item.hotelId, hotels)?.name}</td>
                            <td className="py-3 pr-4">{item.pickupTime}</td>
                            <td className="py-3 pr-4">{totalPax(item)}</td>
                            <td className="py-3 pr-4 uppercase">{item.language}</td>
                            <td className="py-3 pr-4">
                              <span className={classNames(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                item.source === "nexus" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                              )}>
                                {item.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Hotel pickup grouping</h3>
                <p className="text-sm text-slate-500">Group nearby hotels by pickup time to plan feeder vehicles.</p>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {hotelSummary.map((entry) => (
                <div key={entry.hotel.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.hotel.name}</p>
                      <p className="text-sm text-slate-500">{entry.hotel.zone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{entry.total} pax</p>
                      <p className="text-sm text-slate-500">Pickup {entry.earliestPickup}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(entry.byExcursion).map(([excursionId, count]) => (
                      <span key={excursionId} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {getExcursionById(excursionId, excursions)?.name}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Latest Nexus import</h3>
                <p className="text-sm text-slate-500">Upload Excel and map its rows into reservations.</p>
              </div>
              <Upload className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {imports.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.filename}</p>
                      <p className="text-sm text-slate-500">{item.rows} rows · {item.importedAt}</p>
                    </div>
                    <span className={classNames(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      item.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
              <button className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Upload new Excel file
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

<ReservationsView/>

function ExcursionsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {excursions.map((excursion) => (
          <div key={excursion.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{excursion.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Default departure: {excursion.defaultStartTime}</p>
                <p className="text-sm text-slate-500">Meeting point: {excursion.meetingPoint}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider prices</p>
              {excursion.providerOptions.map((option:any) => (
                <div key={option.providerId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{getProviderName(option.providerId, providers)}</p>
                    <p className="text-sm text-slate-500">Selectable override allowed per reservation</p>
                  </div>
                  <p className="font-semibold text-slate-900">{option.defaultPrice > 0 ? currency.format(option.defaultPrice) : "Transport only"}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProvidersView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Providers</h3>
          <p className="text-sm text-slate-500">Boats, transport suppliers, support drivers, and activity vendors.</p>
          <div className="mt-4 space-y-3">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{provider.name}</p>
                  <p className="text-sm capitalize text-slate-500">{provider.type.replace("_", " ")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recommendation</h3>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Keep prices in a separate table per provider + excursion + date range. That lets you keep history when deals change.
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
            Example entity: <span className="font-semibold text-slate-900">provider_excursion_rates.json</span>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{`[
  {
    "id": "rate_1",
    "providerId": "p1",
    "excursionId": "ex1",
    "price": 42,
    "currency": "USD",
    "validFrom": "2026-04-01",
    "validTo": null,
    "isDefault": true
  }
]`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportView() {
  const selectedDate = "2026-04-21";
  const grouped = groupReservationsByExcursion(selectedDate);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Vehicle inventory</h3>
          <p className="text-sm text-slate-500">Only show valid vehicle options that fit the group size.</p>
          <div className="mt-4 space-y-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{vehicle.name}</p>
                    <p className="text-sm text-slate-500">{getProviderName(vehicle.providerId, providers)} · {vehicle.kind}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{vehicle.capacity} seats</p>
                    <p className="text-sm text-slate-500">{currency.format(vehicle.costPerService)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Smart vehicle suggestions</h3>
          <p className="text-sm text-slate-500">Small group should not get a 56-seat bus unless you manually force it.</p>
          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.excursion.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{group.excursion.name}</p>
                    <p className="text-sm text-slate-500">{group.pax} passengers</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Auto match</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.suggestedVehicles.slice(0, 4).map((vehicle) => (
                    <div key={vehicle.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{vehicle.name}</p>
                      <p className="text-sm text-slate-500">{vehicle.capacity} seats · {currency.format(vehicle.costPerService)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuidesView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <div key={guide.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{guide.name}</h3>
                <p className="text-sm text-slate-500">Daily rate: {currency.format(guide.dailyRate)}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Available</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {guide.languages.map((lang: string) => (
                <span key={lang} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase text-slate-700">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportsView() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3">
              <FileSpreadsheet className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Excel import flow</h3>
              <p className="text-sm text-slate-500">Drag file, preview rows, validate, then save into reservations JSON.</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-900">Upload Nexus Excel</p>
            <p className="mt-1 text-sm text-slate-500">Expected fields: locator, lead name, service date, excursion, hotel, pickup time, adults, children, language.</p>
            <button className="mt-4 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Choose file</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Suggested JSON files</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              "excursions.json",
              "providers.json",
              "vehicles.json",
              "hotels.json",
              "tour-guides.json",
              "provider-rates.json",
              "reservations.json",
              "assignments.json",
              "imports.json",
              "expenses.json",
            ].map((file) => (
              <div key={file} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <span className="font-medium text-slate-900">{file}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CostsView() {
  const selectedDate = "2026-04-21";
  const dayAssignments = assignments.filter((a) => a.serviceDate === selectedDate);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Service cost by assignment</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Excursion</th>
                  <th className="py-3 pr-4 font-medium">Vehicle</th>
                  <th className="py-3 pr-4 font-medium">Guide</th>
                  <th className="py-3 pr-4 font-medium">Pax</th>
                  <th className="py-3 pr-4 font-medium">Estimated cost</th>
                </tr>
              </thead>
              <tbody>
                {dayAssignments.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-900">{getExcursionById(item.excursionId, excursions)?.name}</td>
                    <td className="py-3 pr-4">{getVehicleById(item.vehicleId, vehicles)?.name}</td>
                    <td className="py-3 pr-4">{getGuideById(item.guideId, guides)?.name ?? "Unassigned"}</td>
                    <td className="py-3 pr-4">{item.assignedPeople}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{currency.format(item.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Important business rules</h3>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Do not suggest vehicles below required capacity.</li>
              <li>Do not show oversized buses by default for very small groups.</li>
              <li>Allow manual override when operations team wants a different bus.</li>
              <li>Guide suggestion should prioritize most spoken language in that excursion group.</li>
              <li>Pickup time should auto-fill from hotel + excursion combination.</li>
              <li>Track every cost by date so monthly profit reports are easy later.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Best next backend step</h3>
            <p className="mt-2 text-sm text-slate-600">Start with JSON files now, but structure them exactly like future database tables. That way moving to a real API later will be much easier.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileTabbar({ active, onChange }: { active: string; onChange: (value: string) => void }) {
  const items = [
    ["dashboard", LayoutDashboard],
    ["reservations", CalendarDays],
    ["transport", Bus],
    ["imports", FileSpreadsheet],
    ["costs", DollarSign],
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-2 py-2 xl:hidden">
      <div className="grid grid-cols-5 gap-2">
        {items.map(([key, Icon]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={classNames(
              "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium capitalize",
              active === key ? "bg-slate-950 text-white" : "text-slate-500"
            )}
          >
            <Icon className="mb-1 h-4 w-4" />
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EcoAdventuresOperationsDashboard() {
  const [active, setActive] = useState("dashboard");

  const content = (() => {
    switch (active) {
      case "dashboard":
        return <DashboardView />;
      case "reservations":
        return <ReservationsView />;
      case "excursions":
        return <ExcursionsView />;
      case "providers":
        return <ProvidersView />;
      case "transport":
        return <TransportView />;
      case "guides":
        return <GuidesView />;
      case "imports":
        return <ImportsView />;
      case "costs":
        return <CostsView />;
      default:
        return <DashboardView />;
    }
  })();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <Sidebar active={active} onChange={setActive} />
        <main className="min-w-0 flex-1 pb-24 xl:pb-0">
          <Topbar active={active} />
          {content}
        </main>
      </div>
      <MobileTabbar active={active} onChange={setActive} />
    </div>
  );
}
