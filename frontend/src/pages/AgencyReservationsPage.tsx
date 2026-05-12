import { useEffect, useMemo, useState } from "react";
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getRHotels,
  getRExcursions,
  getPickupTimes,
  getAgencyExcursionPrices,
} from "../lib/api";
import { Pencil, Trash2, Plus, X, Save, Clock } from "lucide-react";
import { Link } from "react-router-dom";

type AgencyPortal = {
  id: number;
  username: string;
  agency_id: number;
  agency_name: string;
};
type Reservation ={
    id?: number;
    locator: string;
    lead_name: string;
    phone: string;
    email?: string;
    hotel_id: number;
    hotel_name?: string;
    excursion_id: number;
    excursion_name?: string;
    service_date: string;
    pickup_time?: string;
    adults: number;
    children: number;
    infants: number;
    sale_price_per_person: string;
    sale_total: string;
    paid_amount: string;
    currency: string;
    language: string;
    notes: string;
    payment_method: string;
    card_fee_percent: string;
    card_fee_amount: string;
    final_total_with_card_fee: string;
    status?: string;
    hotel?: number;
    excursion?: number;
}

type PickupTime = {
  id?: number;
  excursion: number;
  hotel: number;
  time: string;
  notes?: string;
};

type AgencyExcursionPrice = {
  id?: number;
  agency: number;
  excursion: number;
  adult_price: string;
  child_price: string;
  currency: string;
  is_active: boolean;
};

type Option = {
  id: number;
  name: string;
  default_sale_price?: string;
  currency?: string;
};

const emptyForm = {
  locator: "",
  lead_name: "",
  phone: "",
  email: "",
  hotel_id: "",
  excursion_id: "",
  service_date: "",
  pickup_time: "",
  adults: 1,
  children: 0,
  infants: 0,
  sale_price_per_person: "0.00",
  sale_total: "0.00",
  paid_amount: "0.00",
  currency: "USD",
  language: "en",
  notes: "",
  payment_method: "cash",
  card_fee_percent: "12.00",
  card_fee_amount: "0.00",
  final_total_with_card_fee: "0.00",
};
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function AgencyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hotels, setHotels] = useState<Option[]>([]);
  const [excursions, setExcursions] = useState<Option[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [agencyPortal, setAgencyPortal] = useState<AgencyPortal | null>(null);
  const [pickupTimes, setPickupTimes] = useState<PickupTime[]>([]);
  const [agencyExcursionPrices, setAgencyExcursionPrices] = useState<
    AgencyExcursionPrice[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const storedAgencyPortal = localStorage.getItem("agency_portal");

    if (storedAgencyPortal) {
      setAgencyPortal(JSON.parse(storedAgencyPortal));
    }

    const [
      reservationData,
      hotelData,
      excursionData,
      pickupTimeData,
      agencyExcursionPriceData,
    ] = await Promise.all([
      getReservations(),
      getRHotels(),
      getRExcursions(),
      getPickupTimes(),
      getAgencyExcursionPrices(),
    ]);

    setReservations(reservationData as Reservation[]);
    setHotels(hotelData as Option[]);
    setExcursions(excursionData as Option[]);
    setPickupTimes(pickupTimeData as PickupTime[]);
    setAgencyExcursionPrices(
      agencyExcursionPriceData as AgencyExcursionPrice[],
    );
  }

  function findDefaultPickupTime(
    list: PickupTime[],
    excursionId?: number | string | null,
    hotelId?: number | string | null,
  ) {
    if (!excursionId || !hotelId) return "";

    const match = list.find(
      (item) =>
        Number(item.excursion) === Number(excursionId) &&
        Number(item.hotel) === Number(hotelId),
    );

    return match?.time ? match.time.slice(0, 5) : "";
  }

  const suggestedPickupTime = useMemo(() => {
    return findDefaultPickupTime(pickupTimes, form.excursion_id, form.hotel_id);
  }, [pickupTimes, form.excursion_id, form.hotel_id]);

  useEffect(() => {
    if (!showForm) return;

    setForm((prev) => ({
      ...prev,
      pickup_time: suggestedPickupTime || "",
    }));
  }, [suggestedPickupTime, showForm]);

  function formatTime(time?: string | null) {
    if (!time) return "Auto";

    const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function todayDateOnly() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function getReservationDate(date: string) {
    const reservationDate = new Date(`${date}T00:00:00`);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate;
  }

  function canUpdateReservation(serviceDate: string) {
    return getReservationDate(serviceDate) > todayDateOnly();
  }

  function canDeleteReservation(serviceDate: string) {
    return getReservationDate(serviceDate) > todayDateOnly();
  }

  function findAgencyExcursionPrice(
    agencyId?: number | null,
    excursionId?: number | string | null,
  ) {
    if (!agencyId || !excursionId) return null;

    return agencyExcursionPrices.find(
      (item) =>
        Number(item.agency) === Number(agencyId) &&
        Number(item.excursion) === Number(excursionId) &&
        item.is_active,
    );
  }

  function findExcursion(excursionId?: number | string | null) {
    if (!excursionId) return null;

    return excursions.find((item) => Number(item.id) === Number(excursionId));
  }

  useEffect(() => {
    if (!showForm) return;
    if (!form.excursion_id) return;
    if (!agencyPortal?.agency_id) return;

    const agencyPrice = findAgencyExcursionPrice(
      agencyPortal.agency_id,
      form.excursion_id,
    );

    const excursion = findExcursion(form.excursion_id);

    let adultPrice = 0;
    let childPrice = 0;

    if (agencyPrice) {
      adultPrice = Number(agencyPrice.adult_price || 0);
      childPrice = Number(agencyPrice.child_price || 0);
    } else if (excursion) {
      adultPrice = Number(excursion.default_sale_price || 0);
      childPrice = adultPrice * 0.5;
    }

    const adults = Number(form.adults || 0);
    const children = Number(form.children || 0);
    const total = adults * adultPrice + children * childPrice;

    setForm((prev) => ({
      ...prev,
      sale_price_per_person: adultPrice.toFixed(2),
      sale_total: total.toFixed(2),
      currency: "USD",
    }));
  }, [
    showForm,
    agencyPortal?.agency_id,
    form.excursion_id,
    form.adults,
    form.children,
    agencyExcursionPrices,
    excursions,
  ]);
  useEffect(() => {
    const saleTotal = Number(form.sale_total || 0);
    const cardFeePercent = Number(form.card_fee_percent || 0);

    const cardFeeAmount =
      form.payment_method === "card" ? (saleTotal * cardFeePercent) / 100 : 0;

    const finalTotal = saleTotal + cardFeeAmount;

    setForm((prev) => ({
      ...prev,
      card_fee_amount: cardFeeAmount.toFixed(2),
      final_total_with_card_fee: finalTotal.toFixed(2),
    }));
  }, [form.payment_method, form.sale_total, form.card_fee_percent]);

  const filteredReservations = useMemo(() => {
    const term = search.toLowerCase();

    return reservations.filter((reservation) => {
      return (
        reservation.lead_name?.toLowerCase().includes(term) ||
        reservation.phone?.toLowerCase().includes(term) ||
        reservation.locator?.toLowerCase().includes(term) ||
        reservation.hotel_name?.toLowerCase().includes(term) ||
        reservation.excursion_name?.toLowerCase().includes(term)
      );
    });
  }, [reservations, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(reservation: Reservation) {
    if (!canUpdateReservation(reservation.service_date)) {
      alert(
        "This reservation cannot be updated on or after the excursion date.",
      );
      return;
    }

    setEditingId(reservation.id ?? null);
    setShowForm(true);

    setForm({
      locator: reservation.locator || "",
      lead_name: reservation.lead_name || "",
      phone: reservation.phone || "",
      email: reservation.email || "",
      hotel_id: String(reservation.hotel_id || reservation.hotel || ""),
      excursion_id: String(
        reservation.excursion_id || reservation.excursion || "",
      ),
      service_date: reservation.service_date || "",
      pickup_time: reservation.pickup_time || "",
      adults: reservation.adults || 1,
      children: reservation.children || 0,
      infants: reservation.infants || 0,
      sale_price_per_person: reservation.sale_price_per_person || "0.00",
      sale_total: reservation.sale_total || "0.00",
      paid_amount: "0.00",
      currency: "USD",
      language: reservation.language || "en",
      notes: reservation.notes || "",
      payment_method: reservation.payment_method || "cash",
      card_fee_percent: reservation.card_fee_percent || "12.00",
      card_fee_amount: reservation.card_fee_amount || "0.00",
      final_total_with_card_fee:
        reservation.final_total_with_card_fee ||
        reservation.sale_total ||
        "0.00",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.locator ||
      !form.lead_name ||
      !form.phone ||
      !form.hotel_id ||
      !form.excursion_id ||
      !form.service_date
    ) {
      alert(
        "Please complete locator, client name, phone, hotel, excursion and date.",
      );
      return;
    }

    if (!form.pickup_time) {
      alert("No pickup time is configured for this excursion and hotel.");
      return;
    }
    const finalTotal =
      form.payment_method === "card"
        ? form.final_total_with_card_fee
        : form.sale_total;

    const payload = {
      locator: form.locator,

      lead_name: form.lead_name,
      phone: form.phone || "",
      email: form.email || "",

      excursion_id: Number(form.excursion_id),
      hotel_id: Number(form.hotel_id),
      agency_id: agencyPortal?.agency_id,

      service_date: form.service_date,
      pickup_time: form.pickup_time || null,

      adults: Number(form.adults),
      children: Number(form.children),
      infants: Number(form.infants),

      language: form.language || "en",
      status: "pending",

      sale_price_per_person: form.sale_price_per_person || "0.00",
      sale_total: finalTotal || "0.00",
      paid_amount: "0.00",
      currency: "USD",

      agency_price:
        form.payment_method === "agency_collects"
          ? finalTotal || "0.00"
          : "0.00",

      agency_paid: "0.00",

      payment_method: form.payment_method,
      card_fee_percent: form.card_fee_percent || "12.00",
      card_fee_amount: form.card_fee_amount || "0.00",
      final_total_with_card_fee:
        form.final_total_with_card_fee || finalTotal || "0.00",

      notes: form.notes || "",
      internal_notes: "",
    };

    try {
      setLoading(true);

      if (editingId) {
        await updateReservation(editingId, payload);
        alert("Reservation updated successfully.");
      } else {
        await createReservation(payload);
        alert("Reservation created successfully.");
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Reservation save error:", error.response?.data ?? error);
      alert(
        JSON.stringify(error.response?.data ?? "Failed to save reservation."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reservation: Reservation) {
    if (!canDeleteReservation(reservation.service_date)) {
      alert(
        "This reservation cannot be deleted on or after the excursion date.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete reservation for ${reservation.lead_name}?`,
    );

    if (!confirmed) return;

    try {
      if (!reservation.id) {
        alert("Invalid reservation ID.");
        return;
      }
      await deleteReservation(reservation.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete reservation.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              {agencyPortal?.agency_name || "Agency"} Reservations
            </h1>

            <p className="text-sm text-slate-500">
              View, create and manage your agency reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/agency/statement"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              View Statement
            </Link>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New Reservation
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">
                {editingId ? "Update Reservation" : "Create Reservation"}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Locator
              </label>
              <input
                value={form.locator}
                onChange={(e) => setForm({ ...form, locator: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Client name
                </label>
                <input
                  value={form.lead_name}
                  onChange={(e) =>
                    setForm({ ...form, lead_name: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Email optional
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Excursion
                </label>
                <select
                  value={form.excursion_id}
                  onChange={(e) =>
                    setForm({ ...form, excursion_id: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="">Select excursion</option>
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
                  value={form.hotel_id}
                  onChange={(e) =>
                    setForm({ ...form, hotel_id: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="">Select hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                min={getTodayString()}
                value={form.service_date}
                onChange={(e) =>
                  setForm({ ...form, service_date: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Pickup time
                </label>
                <input
                  value={
                    suggestedPickupTime
                      ? formatTime(suggestedPickupTime)
                      : "No pickup rule found"
                  }
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold"
                />
                {!suggestedPickupTime && (
                  <p className="text-xs text-amber-600">
                    No pickup time is configured for this excursion and hotel.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.adults}
                  onChange={(e) =>
                    setForm({ ...form, adults: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.children}
                  onChange={(e) =>
                    setForm({ ...form, children: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Infants
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.infants}
                  onChange={(e) =>
                    setForm({ ...form, infants: Number(e.target.value) })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Price per adult
                </label>
                <input
                  value={form.sale_price_per_person}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Sale total
                </label>
                <input
                  value={form.sale_total}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Payment method
                </label>

                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({ ...form, payment_method: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="cash">Customer pays cash</option>
                  <option value="card">Customer pays card + 12%</option>
                  <option value="agency_collects">
                    Agency collects / agency pays
                  </option>
                </select>
              </div>

              {form.payment_method === "card" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      Card fee %
                    </label>

                    <input
                      value={form.card_fee_percent}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      Card fee amount
                    </label>

                    <input
                      value={form.card_fee_amount}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      Final total with card fee
                    </label>

                    <input
                      value={form.final_total_with_card_fee}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  Currency
                </label>
                <input
                  value="USD"
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading
                ? "Saving..."
                : editingId
                  ? "Update Reservation"
                  : "Create Reservation"}
            </button>
          </form>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reservations..."
            className="mb-5 w-full max-w-md rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Locator</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Excursion</th>
                  <th className="px-4 py-3">Hotel</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((reservation) => {
                  const canEdit = canUpdateReservation(
                    reservation.service_date,
                  );
                  const canDelete = canDeleteReservation(
                    reservation.service_date,
                  );

                  return (
                    <tr key={reservation.id}>
                      <td className="px-4 py-3 font-semibold">
                        {reservation.locator || reservation.id}
                      </td>
                      <td className="px-4 py-3">{reservation.lead_name}</td>
                      <td className="px-4 py-3">
                        {reservation.excursion_name}
                      </td>
                      <td className="px-4 py-3">{reservation.hotel_name}</td>
                      <td className="px-4 py-3">{reservation.service_date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatTime(reservation.pickup_time)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(reservation.adults || 0) +
                          (reservation.children || 0) +
                          (reservation.infants || 0)}
                      </td>
                      <td className="px-4 py-3">
                        USD {reservation.sale_total || "0.00"}
                      </td>
                      <td className="px-4 py-3">{reservation.status}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleEdit(reservation)}
                            className="rounded-xl border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={() => handleDelete(reservation)}
                            className="rounded-xl border border-red-200 p-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReservations.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
