import { useEffect, useMemo, useState } from "react";
import {
  createReservation,
  deleteReservation,
  getAgencies,
  getPickupTimes,
  getRExcursions,
  getRHotels,
  getReservations,
  updateReservation,
} from "../lib/api";

type Option = {
  id?: number;
  name: string;
};

type Agency = {
  id?: number;
  name: string;
};

type PickupTime = {
  id?: number;
  excursion: number;
  hotel: number;
  zone?: number | null;
  time: string;
  notes?: string;
  excursion_name?: string;
  hotel_name?: string;
  zone_name?: string;
};

type Reservation = {
  id?: number;
  locator: string;
  lead_name: string;
  phone: string;
  email: string;

  excursion?: number;
  hotel?: number;
  agency?: number | null;

  excursion_id?: number;
  hotel_id?: number;
  agency_id?: number | null;

  excursion_name?: string;
  hotel_name?: string;
  agency_name?: string;

  service_date: string;
  pickup_time: string | null;

  adults: number;
  children: number;
  infants: number;

  language: string;
  status: string;

  sale_price_per_person: string;
  sale_total: string;
  paid_amount: string;
  currency: string;

  agency_price: string;
  agency_paid: string;

  notes: string;
  internal_notes: string;

  total_pax?: number;
  balance_due?: string;
  agency_balance?: string;
  profit?: string;
};

const emptyForm: Reservation = {
  locator: "",
  lead_name: "",
  phone: "",
  email: "",

  excursion_id: 0,
  hotel_id: 0,
  agency_id: null,

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

  notes: "",
  internal_notes: "",
};

const languages = [
  ["en", "English"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["de", "German"],
  ["other", "Other"],
];

const statuses = [
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["cancelled", "Cancelled"],
  ["completed", "Completed"],
  ["no_show", "No show"],
];

const currencies = ["USD", "DOP", "EUR"];

function formatTime(time?: string | null) {
  if (!time) return "Auto";

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

export function ReservationsView() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [excursions, setExcursions] = useState<Option[]>([]);
  const [hotels, setHotels] = useState<Option[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pickupTimes, setPickupTimes] = useState<PickupTime[]>([]);

  const [form, setForm] = useState<Reservation>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickupOverridden, setPickupOverridden] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [
        reservationData,
        excursionData,
        hotelData,
        agencyData,
        pickupTimeData,
      ] = await Promise.all([
        getReservations(),
        getRExcursions(),
        getRHotels(),
        getAgencies(),
        getPickupTimes(),
      ]);

      setReservations(reservationData);
      setExcursions(excursionData);
      setHotels(hotelData);
      setAgencies(agencyData);
      setPickupTimes(pickupTimeData);

      const firstExcursionId = excursionData[0]?.id ?? 0;
      const firstHotelId = hotelData[0]?.id ?? 0;

      const defaultPickup = findDefaultPickupTime(
        pickupTimeData,
        firstExcursionId,
        firstHotelId
      );

      setForm((prev) => ({
        ...prev,
        excursion_id: firstExcursionId,
        hotel_id: firstHotelId,
        pickup_time: defaultPickup,
      }));
    } catch (error) {
      console.error("Error loading reservations:", error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadReservations() {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      console.error("Error loading reservations:", error);
      setReservations([]);
    }
  }

  function findDefaultPickupTime(
    list: PickupTime[],
    excursionId?: number | null,
    hotelId?: number | null
  ) {
    if (!excursionId || !hotelId) return "";

    const match = list.find(
      (item) =>
        Number(item.excursion) === Number(excursionId) &&
        Number(item.hotel) === Number(hotelId)
    );

    return match?.time ? match.time.slice(0, 5) : "";
  }

  const suggestedPickupTime = useMemo(() => {
    return findDefaultPickupTime(
      pickupTimes,
      form.excursion_id,
      form.hotel_id
    );
  }, [pickupTimes, form.excursion_id, form.hotel_id]);

  useEffect(() => {
    if (!showForm) return;
    if (pickupOverridden) return;

    setForm((prev) => ({
      ...prev,
      pickup_time: suggestedPickupTime || "",
    }));
  }, [suggestedPickupTime, showForm, pickupOverridden]);

  const getExcursionName = (id?: number | null) => {
    if (!id) return "";
    return excursions.find((item) => item.id === id)?.name ?? "";
  };

  const getHotelName = (id?: number | null) => {
    if (!id) return "";
    return hotels.find((item) => item.id === id)?.name ?? "";
  };

  const getAgencyName = (id?: number | null) => {
    if (!id) return "";
    return agencies.find((item) => item.id === id)?.name ?? "";
  };

  const totalPax =
    Number(form.adults || 0) +
    Number(form.children || 0) +
    Number(form.infants || 0);

  const balanceDue =
    Number(form.sale_total || 0) - Number(form.paid_amount || 0);

  const agencyBalance =
    Number(form.agency_price || 0) - Number(form.agency_paid || 0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return reservations;

    return reservations.filter((item) =>
      [
        item.locator,
        item.lead_name,
        item.phone,
        item.email,
        item.excursion_name,
        item.hotel_name,
        item.agency_name,
        getExcursionName(item.excursion ?? item.excursion_id),
        getHotelName(item.hotel ?? item.hotel_id),
        getAgencyName(item.agency ?? item.agency_id),
        item.status,
        item.language,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, reservations, excursions, hotels, agencies]);

  function openCreateForm() {
    const firstExcursionId = excursions[0]?.id ?? 0;
    const firstHotelId = hotels[0]?.id ?? 0;

    const defaultPickup = findDefaultPickupTime(
      pickupTimes,
      firstExcursionId,
      firstHotelId
    );

    setForm({
      ...emptyForm,
      excursion_id: firstExcursionId,
      hotel_id: firstHotelId,
      pickup_time: defaultPickup,
    });

    setPickupOverridden(false);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: Reservation) {
    setForm({
      ...emptyForm,
      ...item,
      excursion_id: item.excursion ?? item.excursion_id ?? 0,
      hotel_id: item.hotel ?? item.hotel_id ?? 0,
      agency_id: item.agency ?? item.agency_id ?? null,
      pickup_time: item.pickup_time ? item.pickup_time.slice(0, 5) : "",
    });

    setPickupOverridden(Boolean(item.pickup_time));
    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    const firstExcursionId = excursions[0]?.id ?? 0;
    const firstHotelId = hotels[0]?.id ?? 0;

    const defaultPickup = findDefaultPickupTime(
      pickupTimes,
      firstExcursionId,
      firstHotelId
    );

    setForm({
      ...emptyForm,
      excursion_id: firstExcursionId,
      hotel_id: firstHotelId,
      pickup_time: defaultPickup,
    });

    setPickupOverridden(false);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Reservation>(
    field: K,
    value: Reservation[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleExcursionChange(value: number) {
    setPickupOverridden(false);

    setForm((prev) => ({
      ...prev,
      excursion_id: value,
    }));
  }

  function handleHotelChange(value: number) {
    setPickupOverridden(false);

    setForm((prev) => ({
      ...prev,
      hotel_id: value,
    }));
  }

  function handlePickupTimeChange(value: string) {
    setPickupOverridden(true);

    setForm((prev) => ({
      ...prev,
      pickup_time: value,
    }));
  }

  function useSuggestedPickupTime() {
    setPickupOverridden(false);

    setForm((prev) => ({
      ...prev,
      pickup_time: suggestedPickupTime || "",
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      locator: form.locator,
      lead_name: form.lead_name,
      phone: form.phone || "",
      email: form.email || "",

      excursion_id: Number(form.excursion_id),
      hotel_id: Number(form.hotel_id),
      agency_id: form.agency_id ? Number(form.agency_id) : null,

      service_date: form.service_date,
      pickup_time: form.pickup_time || null,

      adults: Number(form.adults),
      children: Number(form.children),
      infants: Number(form.infants),

      language: form.language,
      status: form.status,

      sale_price_per_person: form.sale_price_per_person || "0.00",
      sale_total: form.sale_total || "0.00",
      paid_amount: form.paid_amount || "0.00",
      currency: form.currency || "USD",

      agency_price: form.agency_price || "0.00",
      agency_paid: form.agency_paid || "0.00",

      notes: form.notes || "",
      internal_notes: form.internal_notes || "",
    };
    console.log("Submitting reservation with payload:", payload);

    try {
      if (editingId) {
        await updateReservation(editingId, payload);
      } else {
        await createReservation(payload);
      }

      await loadReservations();
      closeForm();
    } catch (error: any) {
      console.error("Error saving reservation:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this reservation?"
    );

    if (!confirmed) return;

    try {
      await deleteReservation(id);
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      console.error("Error deleting reservation:", error.response?.data ?? error);
    }
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
              Manage bookings, clients, hotels, excursions, pickup times and payment balances.
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
              type="button"
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
            className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
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

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h5 className="mb-4 text-sm font-semibold text-slate-800">
                Client information
              </h5>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Locator
                  </label>
                  <input
                    value={form.locator}
                    onChange={(e) =>
                      updateFormField("locator", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Lead name
                  </label>
                  <input
                    value={form.lead_name}
                    onChange={(e) =>
                      updateFormField("lead_name", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateFormField("phone", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateFormField("email", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h5 className="mb-4 text-sm font-semibold text-slate-800">
                Booking details
              </h5>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Excursion
                  </label>
                  <select
                    value={form.excursion_id ?? ""}
                    onChange={(e) =>
                      handleExcursionChange(Number(e.target.value))
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {excursions.map((excursion) => (
                      <option key={excursion.id} value={excursion.id}>
                        {excursion.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Hotel
                  </label>
                  <select
                    value={form.hotel_id ?? ""}
                    onChange={(e) => handleHotelChange(Number(e.target.value))}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Agency
                  </label>
                  <select
                    value={form.agency_id ?? ""}
                    onChange={(e) =>
                      updateFormField(
                        "agency_id",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    <option value="">No agency</option>

                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Service date
                  </label>
                  <input
                    type="date"
                    value={form.service_date}
                    onChange={(e) =>
                      updateFormField("service_date", e.target.value)
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-medium text-slate-500">
                      Pickup time
                    </label>

                    {suggestedPickupTime ? (
                      <button
                        type="button"
                        onClick={useSuggestedPickupTime}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-950"
                      >
                        Use suggested {formatTime(suggestedPickupTime)}
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600">
                        No pickup rule found
                      </span>
                    )}
                  </div>

                  <input
                    type="time"
                    value={form.pickup_time ?? ""}
                    onChange={(e) => handlePickupTimeChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />

                  <p className="text-xs text-slate-500">
                    {pickupOverridden
                      ? "Manual override active. This time will be saved."
                      : suggestedPickupTime
                        ? `Auto-filled from pickup rules: ${formatTime(
                            suggestedPickupTime
                          )}. You can still change it.`
                        : "Choose an excursion and hotel with a saved pickup rule, or enter the time manually."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) =>
                      updateFormField("language", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {languages.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => updateFormField("status", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-800">
                  Passengers
                </h5>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Total pax: {totalPax}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Adults
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.adults}
                    onChange={(e) =>
                      updateFormField("adults", Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Children
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.children}
                    onChange={(e) =>
                      updateFormField("children", Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Infants
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.infants}
                    onChange={(e) =>
                      updateFormField("infants", Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-800">
                  Payment details
                </h5>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Balance: {balanceDue.toFixed(2)} {form.currency}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      updateFormField("currency", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Price per person
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sale_price_per_person}
                    onChange={(e) =>
                      updateFormField("sale_price_per_person", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Sale total
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sale_total}
                    onChange={(e) =>
                      updateFormField("sale_total", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Paid amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.paid_amount}
                    onChange={(e) =>
                      updateFormField("paid_amount", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-800">
                  Agency payment
                </h5>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Agency balance: {agencyBalance.toFixed(2)} {form.currency}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Agency price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.agency_price}
                    onChange={(e) =>
                      updateFormField("agency_price", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Agency paid
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.agency_paid}
                    onChange={(e) =>
                      updateFormField("agency_paid", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <h5 className="mb-4 text-sm font-semibold text-slate-800">
                Notes
              </h5>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Customer notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateFormField("notes", e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    Internal notes
                  </label>
                  <textarea
                    value={form.internal_notes}
                    onChange={(e) =>
                      updateFormField("internal_notes", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
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
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
  <table className="w-full text-left text-sm">
    <thead className="bg-slate-100 text-xs uppercase text-slate-500">
      <tr>
        <th className="px-4 py-3">Locator</th>
        <th className="px-4 py-3">Client</th>
        <th className="px-4 py-3">Excursion</th>
        <th className="px-4 py-3">Hotel</th>
        <th className="px-4 py-3">Date</th>
        <th className="px-4 py-3">Pickup</th>
        <th className="px-4 py-3">Status</th>
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-slate-200 bg-white">
      {filtered.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50">
          <td className="px-4 py-3 font-semibold">{item.locator}</td>
          <td className="px-4 py-3">{item.lead_name}</td>
          <td className="px-4 py-3">{item.excursion_name}</td>
          <td className="px-4 py-3">{item.hotel_name}</td>
          <td className="px-4 py-3">{item.service_date}</td>
          <td className="px-4 py-3">{formatTime(item.pickup_time)}</td>
          <td className="px-4 py-3">{item.status}</td>
          <td className="px-4 py-3 text-right">
            <button
              type="button"
              onClick={() => openEditForm(item)}
              className="mr-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}

      {filtered.length === 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
            No reservations found.
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