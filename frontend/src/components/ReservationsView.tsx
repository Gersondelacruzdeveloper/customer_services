import { useEffect, useMemo, useState } from "react";
import {
  getReservations,
  deleteReservation,
  createReservation,
  updateReservation,
  getHotels,
  getExcursions,
} from "../lib/api";
import { Reservation, Hotel, Excursion } from "@/types/types";

const emptyForm: Reservation = {
  locator: "",
  lead_name: "",
  phone: "",
  email: "",
  excursion_id: 0,
  hotel_id: 0,
  service_date: "",
  pickup_time: "",
  adults: 1,
  children: 0,
  infants: 0,
  language: "en",
  status: "pending",
  sale_price_per_person: "0.00",
  sale_total: "0.00",
  paid_amount: "0.00",
  currency: "USD",
  agency_price: "0.00",
  agency_paid: "0.00",
  agency_id: null,
  notes: "",
  internal_notes: "",
};

export function ReservationsView() {
  const [query, setQuery] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [form, setForm] = useState<Reservation>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);

    try {
      const [reservationsData, hotelsData, excursionsData] = await Promise.all([
        getReservations(),
        getHotels(),
        getExcursions(),
      ]);

      const reservationList = Array.isArray(reservationsData)
        ? reservationsData
        : (reservationsData.results ?? []);

      const hotelList = Array.isArray(hotelsData)
        ? hotelsData
        : (hotelsData.results ?? []);

      const excursionList = Array.isArray(excursionsData)
        ? excursionsData
        : (excursionsData.results ?? []);

      setReservations(reservationList);
      setHotels(hotelList);
      setExcursions(excursionList);

      setForm((prev) => ({
        ...prev,
        hotel_id: hotelList[0]?.id ?? 0,
        excursion_id: excursionList[0]?.id ?? 0,
      }));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadReservations() {
    try {
      const data = await getReservations();

      if (Array.isArray(data)) {
        setReservations(data);
      } else {
        setReservations(data.results ?? []);
      }
    } catch (error) {
      console.error("Error loading reservations:", error);
      setReservations([]);
    }
  }

  const getHotelName = (id: number) => {
    return hotels.find((hotel) => hotel.id === id)?.name ?? "";
  };

  const getExcursionName = (id: number) => {
    return excursions.find((excursion) => excursion.id === id)?.name ?? "";
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return reservations;

    return reservations.filter((r) => {
      const hotel = getHotelName(r.hotel_id);
      const excursion = getExcursionName(r.excursion_id);

      return [r.locator, r.lead_name, hotel, excursion, r.agency]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, reservations, hotels, excursions]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      hotel_id: hotels[0]?.id ?? 0,
      excursion_id: excursions[0]?.id ?? 0,
    });

    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: Reservation) {
    setForm(item);
    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
      hotel_id: hotels[0]?.id ?? 0,
      excursion_id: excursions[0]?.id ?? 0,
    });
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const payload = {
        locator: form.locator,
        lead_name: form.lead_name,
        phone: form.phone || "",
        email: form.email || "",

        excursion_id: Number(form.excursion_id),
        hotel_id: Number(form.hotel_id),

        service_date: form.service_date,
        pickup_time: form.pickup_time || null,

        adults: Number(form.adults),
        children: Number(form.children),
        infants: Number(form.infants),

        language: form.language,
        status: form.status || "pending",

        sale_price_per_person: form.sale_price_per_person || "0.00",
        sale_total: form.sale_total || "0.00",
        paid_amount: form.paid_amount || "0.00",
        currency: form.currency || "USD",

        agency_price: form.agency_price || "0.00",
        agency_paid: form.agency_paid || "0.00",

        notes: form.notes || "",
        internal_notes: form.internal_notes || "",

        // IMPORTANT: do NOT send agency as text
        agency_id: null,
      };

      if (editingId) {
        await updateReservation(editingId, payload);
      } else {
        await createReservation(payload);
      }

      await loadReservations();
      closeForm();
    } catch (error: any) {
      console.error("Error submitting form:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this reservation?",
    );
    if (!confirmed) return;

    try {
      await deleteReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  }

  function updateFormField<K extends keyof Reservation>(
    field: K,
    value: Reservation[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Reservations
            </h3>
            <p className="text-sm text-slate-500">
              Manage reservations, clients, hotels, excursions and pickups.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reservations..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <button
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add reservation
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">
                {editingId ? "Edit reservation" : "Add reservation"}
              </h4>

              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input
                value={form.locator}
                onChange={(e) => updateFormField("locator", e.target.value)}
                placeholder="Locator"
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.lead_name}
                onChange={(e) => updateFormField("lead_name", e.target.value)}
                placeholder="Client name"
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <select
                value={form.excursion_id}
                onChange={(e) =>
                  updateFormField("excursion_id", Number(e.target.value))
                }
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {excursions.map((excursion) => (
                  <option key={excursion.id} value={excursion.id}>
                    {excursion.name}
                  </option>
                ))}
              </select>

              <select
                value={form.hotel_id}
                onChange={(e) =>
                  updateFormField("hotel_id", Number(e.target.value))
                }
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.service_date}
                onChange={(e) =>
                  updateFormField("service_date", e.target.value)
                }
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                type="time"
                value={form.pickup_time ?? ""}
                onChange={(e) => updateFormField("pickup_time", e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                type="number"
                min={0}
                value={form.adults}
                onChange={(e) =>
                  updateFormField("adults", Number(e.target.value))
                }
                placeholder="Adults"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                type="number"
                min={0}
                value={form.children}
                onChange={(e) =>
                  updateFormField("children", Number(e.target.value))
                }
                placeholder="Children"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                type="number"
                min={0}
                value={form.infants}
                onChange={(e) =>
                  updateFormField("infants", Number(e.target.value))
                }
                placeholder="Infants"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <select
                value={form.language}
                onChange={(e) => updateFormField("language", e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="de">German</option>
                <option value="other">Other</option>
              </select>

              <input
                value={form.agency ?? ""}
                onChange={(e) => updateFormField("agency", e.target.value)}
                placeholder="Agency"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.notes ?? ""}
                onChange={(e) => updateFormField("notes", e.target.value)}
                placeholder="Notes"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {editingId ? "Update reservation" : "Create reservation"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">
              Loading reservations...
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Locator</th>
                  <th className="py-3 pr-4 font-medium">Client</th>
                  <th className="py-3 pr-4 font-medium">Excursion</th>
                  <th className="py-3 pr-4 font-medium">Hotel</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Pickup</th>
                  <th className="py-3 pr-4 font-medium">Pax</th>
                  <th className="py-3 pr-4 font-medium">Language</th>
                  <th className="py-3 pr-4 font-medium">Agency</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {item.locator}
                    </td>

                    <td className="py-3 pr-4">{item.lead_name}</td>

                    <td className="py-3 pr-4">
                      {getExcursionName(item.excursion_id)}
                    </td>

                    <td className="py-3 pr-4">{getHotelName(item.hotel_id)}</td>

                    <td className="py-3 pr-4">{item.service_date}</td>
                    <td className="py-3 pr-4">{item.pickup_time || "Auto"}</td>

                    <td className="py-3 pr-4">
                      {item.total_pax ??
                        item.adults + item.children + item.infants}
                    </td>

                    <td className="py-3 pr-4 uppercase">{item.language}</td>
                    <td className="py-3 pr-4">{item.agency}</td>

                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(item)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
