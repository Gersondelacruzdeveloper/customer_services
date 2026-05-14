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
  updateOperation,
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
  const today = new Date().toISOString().split("T")[0];
  const [operationSearch, setOperationSearch] = useState("");
  const [operationDateFilter, setOperationDateFilter] = useState(today);
  const [operationStatusFilter, setOperationStatusFilter] = useState("");
  const [operationStatus, setOperationStatus] = useState("draft");
  const [editingOperationId, setEditingOperationId] = useState<number | null>(
    null,
  );

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
      console.error("Error cargando datos de operaciones:", error);
    } finally {
      setLoading(false);
    }
  }


  function getOperationActionLabel(status: string) {
  if (status === "draft") return "Send to provider";
  if (status === "sent") return "Mark confirmed";
  if (status === "confirmed") return "Mark completed";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";

  return "Actualizar estado";
}



  const filteredOperations = useMemo(() => {
    const q = operationSearch.toLowerCase().trim();

    return operations
      .filter((operation) => {
        const matchesDate =
          !operationDateFilter || operation.date === operationDateFilter;

        const matchesStatus =
          !operationStatusFilter || operation.status === operationStatusFilter;

        const matchesSearch =
          !q ||
          [
            operation.title,
            operation.date,
            operation.excursion_name,
            operation.provider_name,
            operation.provider_service_name,
            operation.vehicle_name,
            operation.driver_name,
            operation.driver_phone,
            operation.status,
            operation.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q);

        return matchesDate && matchesStatus && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [operations, operationSearch, operationDateFilter, operationStatusFilter]);
  //--------------------------------------------------------------- edit opetaions

  function handleEditOperation(operation: Operation) {
    setEditingOperationId(operation.id);
    setOperationStatus(operation.status || "draft");
    setDateFilter(operation.date);
    setExcursionFilter(operation.excursion ? String(operation.excursion) : "");
    setProviderId(operation.provider ? String(operation.provider) : "");
    setProviderServiceId(
      operation.provider_service ? String(operation.provider_service) : "",
    );
    setVehicleName(operation.vehicle_name || "");
    setDriverName(operation.driver_name || "");
    setDriverPhone(operation.driver_phone || "");
    setNotes(operation.notes || "");
  }

  //-------------------------------------------------------------- cancel edit:

  function cancelEditOperation() {
    setEditingOperationId(null);
    setVehicleName("");
    setDriverName("");
    setDriverPhone("");
    setNotes("");
    setProviderServiceId("");
    setOperationStatus("draft");
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

  async function handleSaveOperation() {
    if (!dateFilter) {
      alert("Por favor seleccione una fecha.");
      return;
    }

    if (!providerId) {
      alert("Por favor seleccione un proveedor.");
      return;
    }

    if (!editingOperationId && selectedIds.length === 0) {
      alert("Por favor seleccione al menos una reserva.");
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
      status: operationStatus,
      ...(editingOperationId ? {} : { reservation_ids: selectedIds }),
    };

    try {
      if (editingOperationId) {
        await updateOperation(editingOperationId, payload);
        alert("Operación actualizada.");
      } else {
        await createOperation(payload);
        alert("Operación creada.");
      }

      await loadData();

      setEditingOperationId(null);
      setSelectedIds([]);
      setVehicleName("");
      setDriverName("");
      setDriverPhone("");
      setNotes("");
      setProviderServiceId("");
    } catch (error) {
      console.error("Error guardando operación:", error);
      alert("Error guardando operación.");
    }
  }

  async function handleDeleteOperation(id: number) {
    const confirmed = window.confirm("Delete this operation?");
    if (!confirmed) return;

    try {
      await deleteOperation(id);
      setOperations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error eliminando operación:", error);
      alert("Error eliminando operación.");
    }
  }

  async function handleMarkSent(id: number) {
    try {
      await markOperationSent(id);
      await loadData();
    } catch (error) {
      console.error("Error marcando operación como enviada:", error);
      alert("Error marcando operación como enviada.");
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
          <h1> Operación de Proveedor</h1>
          <div class="muted">${operation.title}</div>

          <p>
            <strong>Fecha:</strong> ${operation.date}<br/>
           ${
             operation.excursion_name
               ? `<strong>Excursion:</strong> ${operation.excursion_name}<br/>`
               : ""
           }
            <strong>Proveedor:</strong> ${operation.provider_name}<br/>

            ${
              operation.provider_service_name
                ? `<strong>Servicio del proveedor:</strong> ${operation.provider_service_name}<br/>`
                : ""
            }
            <strong>Vehículo/Bote:</strong> ${operation.vehicle_name || "-"}<br/>
            <strong>Chofer/Capitán:</strong> ${operation.driver_name || "-"}<br/>
            <strong>Teléfono:</strong> ${operation.driver_phone || "-"}
          </p>

          <div class="summary">
            <div class="box">Adultos <strong>${operation.reservations.reduce(
              (sum, r) => sum + Number(r.adults || 0),
              0,
            )}</strong></div>
            <div class="box">Niños <strong>${operation.reservations.reduce(
              (sum, r) => sum + Number(r.children || 0),
              0,
            )}</strong></div>
            <div class="box">Infantes <strong>${operation.reservations.reduce(
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
                <th>Recogida</th>
                <th>Hotel</th>
                <th>Cliente</th>
                <th>Phone</th>
                <th>Adults</th>
                <th>Children</th>
                <th>Infants</th>
                <th>Total</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <p style="margin-top: 24px;">
            <strong>Notas de la operación:</strong><br/>
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
  <div className="space-y-6 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">
              Operaciones
            </h3>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Seleccione reservas, asígnelas a un proveedor y luego imprima o envíe la lista de recogida.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveOperation}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {editingOperationId ? "Actualizar operación" : "Crear operación"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setSelectedIds([]);
            }}
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
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
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          >
            <option value="">Todas las excursiones</option>
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
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          >
            <option value="">Seleccionar proveedor</option>
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
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {providerId
                ? "Seleccionar servicio de proveedor"
                : "Seleccionar proveedor primero"}
            </option>

            {filteredProviderServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.cost_price} {service.currency} /{" "}
                {service.price_type}
              </option>
            ))}
          </select>
        </div>

        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, hotel, teléfono, agencia..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
          placeholder="Autobús / barco / vehículo"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <input
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="Nombre del chofer / capitán"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <input
          value={driverPhone}
          onChange={(e) => setDriverPhone(e.target.value)}
          placeholder="Teléfono del chofer / capitán"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <select
          value={operationStatus}
          onChange={(e) => setOperationStatus(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        >
          <option value="draft">Borrador</option>
          <option value="sent">Enviado al proveedor</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas de la operación"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:col-span-2 lg:col-span-4"
        />
      </div>

      <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Seleccionados</p>
          <p className="text-xl font-bold text-slate-900">{selectedIds.length}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Adultos</p>
          <p className="text-xl font-bold text-slate-900">{totalAdults}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Niños / Infantes</p>
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
            Reservas para asignar
          </h4>
          <p className="text-sm text-slate-500">
            Ordenado por hora de recogida y luego por hotel.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={selectAllVisible}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Seleccionar visibles
          </button>

          <button
            type="button"
            onClick={clearSelected}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="block md:hidden">
        {filteredReservations.map((item) => {
          const selected = item.id ? selectedIds.includes(item.id) : false;

          return (
            <div key={item.id} className="border-b border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.lead_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.excursion_name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleReservation(item.id)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-700"
                >
                  {selected ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Recogida</p>
                  <p className="font-semibold">{formatTime(item.pickup_time)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Pax</p>
                  <p className="font-semibold">{paxTotal(item)}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Hotel</p>
                  <p>{item.hotel_name}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Teléfono</p>
                  <p>{item.phone || "-"}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Estado</p>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReservations.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            No se encontraron reservas para estos filtros.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Seleccionar</th>
              <th className="px-4 py-3">Recogida</th>
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Excursión</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3">Estado</th>
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
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No se encontraron reservas para estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h4 className="font-semibold text-slate-900">Operaciones creadas</h4>

      <div className="mb-4 mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={operationSearch}
            onChange={(e) => setOperationSearch(e.target.value)}
            placeholder="Buscar operaciones..."
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <input
          type="date"
          value={operationDateFilter}
          onChange={(e) => setOperationDateFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />

        <select
          value={operationStatusFilter}
          onChange={(e) => setOperationStatusFilter(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setOperationDateFilter(today)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setOperationDateFilter(tomorrow.toISOString().split("T")[0]);
            }}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Mañana
          </button>

          <button
            type="button"
            onClick={() => setOperationDateFilter("")}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Todas
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filteredOperations.map((operation) => (
          <div
            key={operation.id}
            className="rounded-3xl border border-slate-200 p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h5 className="font-semibold text-slate-900">
                  {operation.vehicle_name || "Operación"}
                </h5>

                <p className="mt-1 text-sm font-bold tracking-tight text-slate-900">
                  {operation.excursion_name ? `${operation.excursion_name} • ` : ""}
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

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <span
                  className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold ${
                    operation.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : operation.status === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : operation.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : operation.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                  }`}
                >
                  {operation.status}
                </span>

                <button
                  type="button"
                  onClick={() => printOperation(operation)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  PDF
                </button>

                <button
                  type="button"
                  onClick={() => handleEditOperation(operation)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkSent(operation.id)}
                  disabled={
                    operation.status === "completed" ||
                    operation.status === "cancelled"
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {getOperationActionLabel(operation.status)}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteOperation(operation.id)}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white sm:col-span-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredOperations.length === 0 && (
          <p className="text-sm text-slate-500">
            No se encontraron operaciones para estos filtros.
          </p>
        )}
      </div>
    </div>
  </div>
);
}
