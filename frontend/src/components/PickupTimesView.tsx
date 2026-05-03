import { useEffect, useMemo, useState } from "react";
import {
  createPickupTime,
  deletePickupTime,
  getPickupTimes,
  getRExcursions,
  getRHotels,
  updatePickupTime,
  importPickupTimesExcel,
} from "../lib/api";
import type { Excursion, Hotel, PickupTime } from "@/types/types";
import { formatCaribbeanTime } from "../lib/utils";

const emptyForm: PickupTime = {
  excursion: 0,
  hotel: 0,
  zone: null,
  time: "",
  notes: "",
};

export function PickupTimesView() {
  const [pickupTimes, setPickupTimes] = useState<PickupTime[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [form, setForm] = useState<PickupTime>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);


  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setLoading(true);

    const result = await importPickupTimesExcel(file);

    await loadPickupTimes();

    if (result.errors?.length) {
      console.warn("Pickup time import errors:", result.errors);
      alert(
        `Imported ${result.created_or_updated} pickup times with ${result.errors.length} errors.`,
      );
    } else {
      alert(`Imported ${result.created_or_updated} pickup times successfully.`);
    }
  } catch (error: any) {
    console.error("Import error:", error.response?.data ?? error);
    alert("Error importing pickup times Excel file.");
  } finally {
    setLoading(false);
    e.target.value = "";
  }
}
  async function loadInitialData() {
    try {
      setLoading(true);

      const [pickupData, hotelsData, excursionsData] = await Promise.all([
        getPickupTimes() as Promise<PickupTime[]>,
        getRHotels() as Promise<Hotel[]>,
        getRExcursions() as Promise<Excursion[]>,
      ]);

      setPickupTimes(pickupData);
      setHotels(hotelsData);
      setExcursions(excursionsData);

      setForm((prev) => ({
        ...prev,
        hotel: Number(hotelsData[0]?.id ?? 0),
        excursion: Number(excursionsData[0]?.id ?? 0),
      }));
    } catch (error) {
      console.error("Error loading pickup times:", error);
      setPickupTimes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPickupTimes() {
    try {
      const data = await getPickupTimes() as PickupTime[];
      setPickupTimes(data);
    } catch (error) {
      console.error("Error loading pickup times:", error);
      setPickupTimes([]);
    }
  }

  const getHotelName = (id: number) => {
    return hotels.find((hotel) => Number(hotel.id) === id)?.name ?? "";
  };

  const getExcursionName = (id: number) => {
    return excursions.find((excursion) => Number(excursion.id) === id)?.name ?? "";
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return pickupTimes;

    return pickupTimes.filter((item) =>
      [
        item.excursion_name,
        item.hotel_name,
        item.zone_name,
        item.notes,
        item.time,
        getExcursionName(item.excursion),
        getHotelName(item.hotel),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, pickupTimes, hotels, excursions]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      hotel: Number(hotels[0]?.id ?? 0),
      excursion: Number(excursions[0]?.id ?? 0),
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: PickupTime) {
    setForm({
      id: item.id,
      excursion: item.excursion,
      hotel: item.hotel,
      zone: item.zone ?? null,
      time: item.time?.slice(0, 5) ?? "",
      notes: item.notes ?? "",
    });

    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm({
      ...emptyForm,
      hotel: Number(hotels[0]?.id ?? 0),
      excursion: Number(excursions[0]?.id ?? 0),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof PickupTime>(
    field: K,
    value: PickupTime[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      excursion: Number(form.excursion),
      hotel: Number(form.hotel),
      zone: form.zone || null,
      time: form.time,
      notes: form.notes || "",
    };

    try {
      if (editingId) {
        await updatePickupTime(editingId, payload);
      } else {
        await createPickupTime(payload);
      }

      await loadPickupTimes();
      closeForm();
    } catch (error: any) {
      console.error("Error saving pickup time:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this pickup time?"
    );

    if (!confirmed) return;

    try {
      await deletePickupTime(id);
      setPickupTimes((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      console.error("Error deleting pickup time:", error.response?.data ?? error);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Pickup Times
            </h3>

            <p className="text-sm text-slate-500">
              Manage pickup times by excursion and hotel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pickup times..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <button
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add pickup time
            </button>

            <label className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">
                {editingId ? "Edit pickup time" : "Add pickup time"}
              </h4>

              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <select
                value={form.excursion}
                onChange={(e) =>
                  updateFormField("excursion", Number(e.target.value))
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
                value={form.hotel}
                onChange={(e) =>
                  updateFormField("hotel", Number(e.target.value))
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
                type="time"
                value={form.time}
                onChange={(e) => updateFormField("time", e.target.value)}
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.notes}
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
                {editingId ? "Update pickup time" : "Create pickup time"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">
              Loading pickup times...
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Excursion</th>
                  <th className="py-3 pr-4 font-medium">Hotel</th>
                  <th className="py-3 pr-4 font-medium">Zone</th>
                  <th className="py-3 pr-4 font-medium">Time</th>
                  <th className="py-3 pr-4 font-medium">Notes</th>
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
                      {item.excursion_name || getExcursionName(item.excursion)}
                    </td>

                    <td className="py-3 pr-4">
                      {item.hotel_name || getHotelName(item.hotel)}
                    </td>

                    <td className="py-3 pr-4">{item.zone_name || "-"}</td>

                    <td className="py-3 pr-4 font-semibold">
                      {formatCaribbeanTime(item.time)}
                    </td>

                    <td className="py-3 pr-4">{item.notes || "-"}</td>

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
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No pickup times found.
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