import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Search,
  Building2,
  MapPinned,
  Hotel,
  Printer,
  Send,
  Trash2,
  Save,
  Users,
  CheckSquare,
  Square,
  Bus,
} from "lucide-react";

import {
  getReservations,
  getRExcursions,
  getProviders,
  createOperation,
  getOperations,
  deleteOperation,
  markOperationSent,
  getProviderServices,
} from "../lib/api";

import type { ProviderService } from "../types/types";

type Option = {
  id?: number;
  name: string;
};

type Provider = {
  id?: number;
  name: string;
  provider_type?: string;
  phone?: string;
};

type Reservation = {
  id?: number;
  locator: string;
  lead_name: string;
  phone: string;
  email?: string;
  excursion?: number;
  hotel?: number;
  excursion_id?: number;
  hotel_id?: number;
  excursion_name?: string;
  hotel_name?: string;
  agency_name?: string;
  service_date: string;
  pickup_time: string | null;
  adults: number;
  children: number;
  infants: number;
  total_pax?: number;
  language: string;
  status: string;
  notes?: string;
  internal_notes?: string;
};

type Operation = {
  id: number;
  date: string;
  title: string;
  excursion: number;
  excursion_name: string;
  provider: number;
  provider_name: string;
  vehicle_name: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
  total_pax: number;
  reservations: Reservation[];
  provider_service?: number;
  provider_service_name?: string;
};

function formatTime(time?: string | null) {
  if (!time) return "-";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function paxTotal(item: Reservation) {
  return (
    item.total_pax ??
    Number(item.adults || 0) +
      Number(item.children || 0) +
      Number(item.infants || 0)
  );
}

export function OperationsView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [excursions, setExcursions] = useState<Option[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [dateFilter, setDateFilter] = useState("");
  const [excursionFilter, setExcursionFilter] = useState("");
  const [providerId, setProviderId] = useState("");
  const [query, setQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [vehicleName, setVehicleName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [providerServices, setProviderServices] = useState<ProviderService[]>(
    [],
  );
  const [providerServiceId, setProviderServiceId] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        reservationData,
        excursionData,
        providerData,
        operationData,
        providerServiceData,
      ] = await Promise.all([
        getReservations() as Promise<Reservation[]>,
        getRExcursions() as Promise<Option[]>,
        getProviders() as Promise<Provider[]>,
        getOperations() as Promise<Operation[]>,
        getProviderServices() as Promise<ProviderService[]>,
      ]);

      setReservations(reservationData);
      setExcursions(excursionData);
      setProviders(providerData);
      setOperations(operationData);
      setProviderServices(providerServiceData);
    } catch (error) {
      console.error("Error loading operations data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProviderServices = useMemo(() => {
    if (!providerId) return [];

    return providerServices.filter(
      (service) =>
        Number(service.provider) === Number(providerId) && service.is_active,
    );
  }, [providerServices, providerId]);

  const filteredReservations = useMemo(() => {
    const q = query.toLowerCase().trim();

    return reservations
      .filter((item) => {
        const itemExcursionId = item.excursion ?? item.excursion_id;

        const matchesDate = !dateFilter || item.service_date === dateFilter;

        const matchesExcursion =
          !excursionFilter ||
          Number(itemExcursionId) === Number(excursionFilter);

        const matchesQuery =
          !q ||
          [
            item.locator,
            item.lead_name,
            item.phone,
            item.email,
            item.excursion_name,
            item.hotel_name,
            item.agency_name,
            item.status,
            item.language,
            item.notes,
            item.internal_notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);

        const isValidStatus =
          item.status !== "cancelled" && item.status !== "no_show";

        return matchesDate && matchesExcursion && matchesQuery && isValidStatus;
      })
      .sort((a, b) => {
        const timeA = a.pickup_time || "99:99";
        const timeB = b.pickup_time || "99:99";

        if (timeA !== timeB) return timeA.localeCompare(timeB);

        return (a.hotel_name || "").localeCompare(b.hotel_name || "");
      });
  }, [reservations, dateFilter, excursionFilter, query]);

  const selectedReservations = useMemo(() => {
    return filteredReservations.filter(
      (item) => item.id && selectedIds.includes(item.id),
    );
  }, [filteredReservations, selectedIds]);

  const totalAdults = selectedReservations.reduce(
    (sum, item) => sum + Number(item.adults || 0),
    0,
  );

  const totalChildren = selectedReservations.reduce(
    (sum, item) => sum + Number(item.children || 0),
    0,
  );

  const totalInfants = selectedReservations.reduce(
    (sum, item) => sum + Number(item.infants || 0),
    0,
  );

  const totalPax = selectedReservations.reduce(
    (sum, item) => sum + paxTotal(item),
    0,
  );

  function toggleReservation(id?: number) {
    if (!id) return;

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function selectAllVisible() {
    const ids = filteredReservations
      .map((item) => item.id)
      .filter(Boolean) as number[];

    setSelectedIds(ids);
  }

  function clearSelected() {
    setSelectedIds([]);
  }

  async function handleCreateOperation() {
    if (!dateFilter) {
      alert("Please select a date.");
      return;
    }

    // if (!excursionFilter) {
    //   alert("Please select an excursion.");
    //   return;
    // }

    if (!providerId) {
      alert("Please select a provider.");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select at least one reservation.");
      return;
    }

    const payload = {
      date: dateFilter,
      excursion: excursionFilter ? Number(excursionFilter) : null,
      provider: Number(providerId),
      provider_service: providerServiceId ? Number(providerServiceId) : null,
      vehicle_name: vehicleName,
      driver_name: driverName,
      driver_phone: driverPhone,
      notes,
      reservation_ids: selectedIds,
      status: "draft",
    };

    try {
      await createOperation(payload);
      await loadData();

      setSelectedIds([]);
      setVehicleName("");
      setDriverName("");
      setDriverPhone("");
      setNotes("");
      setProviderServiceId("");

      alert("Operation created.");
    } catch (error) {
      console.error("Error creating operation:", error);
      alert("Error creating operation.");
    }
  }

  async function handleDeleteOperation(id: number) {
    const confirmed = window.confirm("Delete this operation?");
    if (!confirmed) return;

    try {
      await deleteOperation(id);
      setOperations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting operation:", error);
    }
  }

  async function handleMarkSent(id: number) {
    try {
      await markOperationSent(id);
      await loadData();
    } catch (error) {
      console.error("Error marking operation as sent:", error);
    }
  }

  function printOperation(operation: Operation) {
    const rows = operation.reservations
      .slice()
      .sort((a, b) => {
        const timeA = a.pickup_time || "99:99";
        const timeB = b.pickup_time || "99:99";
        return timeA.localeCompare(timeB);
      })
      .map(
        (item) => `
          <tr>
            <td>${formatTime(item.pickup_time)}</td>
            <td>${item.hotel_name || ""}</td>
            <td>${item.lead_name}</td>
            <td>${item.phone || ""}</td>
            <td>${item.adults}</td>
            <td>${item.children}</td>
            <td>${item.infants}</td>
            <td>${paxTotal(item)}</td>
            <td>${item.notes || ""}</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${operation.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }

            h1 {
              margin-bottom: 4px;
              font-size: 22px;
            }

            .muted {
              color: #64748b;
              font-size: 13px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin: 20px 0;
            }

            .box {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px;
            }

            .box strong {
              display: block;
              font-size: 18px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }

            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px;
              text-align: left;
            }

            th {
              background: #f1f5f9;
            }
          </style>
        </head>

        <body>
          <h1>Punta Cana Discovery - Provider Operation</h1>
          <div class="muted">${operation.title}</div>

          <p>
            <strong>Date:</strong> ${operation.date}<br/>
           ${
             operation.excursion_name
               ? `<strong>Excursion:</strong> ${operation.excursion_name}<br/>`
               : ""
           }
            <strong>Provider:</strong> ${operation.provider_name}<br/>

            ${
              operation.provider_service_name
                ? `<strong>Provider Service:</strong> ${operation.provider_service_name}<br/>`
                : ""
            }
            <strong>Vehicle/Boat:</strong> ${operation.vehicle_name || "-"}<br/>
            <strong>Driver/Captain:</strong> ${operation.driver_name || "-"}<br/>
            <strong>Phone:</strong> ${operation.driver_phone || "-"}
          </p>

          <div class="summary">
            <div class="box">Adults <strong>${operation.reservations.reduce(
              (sum, r) => sum + Number(r.adults || 0),
              0,
            )}</strong></div>
            <div class="box">Children <strong>${operation.reservations.reduce(
              (sum, r) => sum + Number(r.children || 0),
              0,
            )}</strong></div>
            <div class="box">Infants <strong>${operation.reservations.reduce(
              (sum, r) => sum + Number(r.infants || 0),
              0,
            )}</strong></div>
            <div class="box">Total Pax <strong>${operation.reservations.reduce(
              (sum, r) => sum + paxTotal(r),
              0,
            )}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Pickup</th>
                <th>Hotel</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Adults</th>
                <th>Children</th>
                <th>Infants</th>
                <th>Total</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <p style="margin-top: 24px;">
            <strong>Operation notes:</strong><br/>
            ${operation.notes || "-"}
          </p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">
                Operations
              </h3>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Select reservations, assign them to a provider, then print or send
              the pickup list.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateOperation}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Create operation
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setSelectedIds([]);
              }}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="relative">
            <MapPinned className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={excursionFilter}
              onChange={(e) => {
                setExcursionFilter(e.target.value);
                setSelectedIds([]);
              }}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All excursions</option>
              {excursions.map((excursion) => (
                <option key={excursion.id} value={excursion.id}>
                  {excursion.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setProviderServiceId("");
              }}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Select provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Bus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={providerServiceId}
              onChange={(e) => setProviderServiceId(e.target.value)}
              disabled={!providerId}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">
                {providerId
                  ? "Select provider service"
                  : "Select provider first"}
              </option>

              {filteredProviderServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.cost_price} {service.currency} /{" "}
                  {service.price_type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search client, hotel, phone, agency..."
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            placeholder="Bus / boat / vehicle"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />

          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Driver / captain name"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />

          <input
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="Driver / captain phone"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Operation notes"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Selected</p>
            <p className="text-xl font-bold text-slate-900">
              {selectedIds.length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Adults</p>
            <p className="text-xl font-bold text-slate-900">{totalAdults}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Children / Infants</p>
            <p className="text-xl font-bold text-slate-900">
              {totalChildren} / {totalInfants}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-300">Total pax</p>
            <p className="text-xl font-bold">{totalPax}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">
              Reservations to assign
            </h4>
            <p className="text-sm text-slate-500">
              Ordered by pickup time, then hotel.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Select all visible
            </button>

            <button
              type="button"
              onClick={clearSelected}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Select</th>
              <th className="px-4 py-3">Pickup</th>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Excursion</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredReservations.map((item) => {
              const selected = item.id ? selectedIds.includes(item.id) : false;

              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleReservation(item.id)}
                      className="text-slate-700"
                    >
                      {selected ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {formatTime(item.pickup_time)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-slate-400" />
                      {item.hotel_name}
                    </div>
                  </td>

                  <td className="px-4 py-3">{item.lead_name}</td>
                  <td className="px-4 py-3">{item.phone}</td>
                  <td className="px-4 py-3">{item.excursion_name}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Users className="h-3.5 w-3.5" />
                      {paxTotal(item)}
                    </span>
                  </td>

                  <td className="px-4 py-3">{item.status}</td>
                </tr>
              );
            })}

            {filteredReservations.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No reservations found for these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="font-semibold text-slate-900">Created operations</h4>

        <div className="mt-4 space-y-3">
          {operations.map((operation) => (
            <div
              key={operation.id}
              className="rounded-3xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h5 className="font-semibold text-slate-900">
                    {operation.vehicle_name}
                  </h5>

                <p className="mt-1 text-sm font-bold tracking-tight text-slate-900">
                    {operation.excursion_name
                      ? `${operation.excursion_name} • `
                      : ""}

                    {operation.provider_name}

                    {operation.provider_service_name
                      ? ` • ${operation.provider_service_name}`
                      : ""}

                    • {operation.total_pax} pax
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Vehicle: {operation.vehicle_name || "-"} • Driver:{" "}
                    {operation.driver_name || "-"} • Phone:{" "}
                    {operation.driver_phone || "-"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {operation.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => printOperation(operation)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    Print / PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkSent(operation.id)}
                    className="flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Send className="h-4 w-4" />
                    Mark sent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteOperation(operation.id)}
                    className="flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {operations.length === 0 && (
            <p className="text-sm text-slate-500">No operations created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
