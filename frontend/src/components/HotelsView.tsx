import { useEffect, useMemo, useState } from "react";
import {
  createRHotel,
  deleteRHotel,
  getRHotels,
  getZones,
  updateRHotel,
} from "../lib/api";
import type { Hotel, Zone } from "../types/types";


const emptyForm: Hotel = {
  name: "",
  zone: null,
  area: "",
  address: "",
  pickup_note: "",
  is_active: true,
};

export function HotelsView() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState<Hotel>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [hotelsData, zonesData] = await Promise.all([
        getRHotels(),
        getZones(),
      ]);

      setHotels(hotelsData);
      setZones(zonesData);
    } catch (error) {
      console.error("Error loading hotels:", error);
      setHotels([]);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadHotels() {
    try {
      const data = await getRHotels();
      setHotels(data);
    } catch (error) {
      console.error("Error loading hotels:", error);
      setHotels([]);
    }
  }

  const getZoneName = (id?: number | null) => {
    if (!id) return "";
    return zones.find((zone) => zone.id === id)?.name ?? "";
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return hotels;

    return hotels.filter((hotel) =>
      [
        hotel.name,
        hotel.zone_name,
        getZoneName(hotel.zone),
        hotel.area,
        hotel.address,
        hotel.pickup_note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, hotels, zones]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      zone: zones[0]?.id ?? null,
    });

    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(hotel: Hotel) {
    setForm({
      id: hotel.id,
      name: hotel.name,
      zone: hotel.zone ?? null,
      area: hotel.area ?? "",
      address: hotel.address ?? "",
      pickup_note: hotel.pickup_note ?? "",
      is_active: hotel.is_active ?? true,
      zone_name: hotel.zone_name,
    });

    setEditingId(hotel.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Hotel>(field: K, value: Hotel[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: form.name,
      zone: form.zone || null,
      area: form.area || "",
      address: form.address || "",
      pickup_note: form.pickup_note || "",
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateRHotel(editingId, payload);
      } else {
        await createRHotel(payload);
      }

      await loadHotels();
      closeForm();
    } catch (error: any) {
      console.error("Error saving hotel:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this hotel?"
    );

    if (!confirmed) return;

    try {
      await deleteRHotel(id);
      setHotels((prev) => prev.filter((hotel) => hotel.id !== id));
    } catch (error: any) {
      console.error("Error deleting hotel:", error.response?.data ?? error);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Hotels</h3>

            <p className="text-sm text-slate-500">
              Manage hotels, zones, addresses and pickup notes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hotels..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <button
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add hotel
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
                {editingId ? "Edit hotel" : "Add hotel"}
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
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                placeholder="Hotel name"
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <select
                value={form.zone ?? ""}
                onChange={(e) =>
                  updateFormField(
                    "zone",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                <option value="">No zone</option>

                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.code ? `${zone.code} - ${zone.name}` : zone.name}
                  </option>
                ))}
              </select>

              <input
                value={form.area}
                onChange={(e) => updateFormField("area", e.target.value)}
                placeholder="Area e.g. Bavaro, Cap Cana"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.address}
                onChange={(e) => updateFormField("address", e.target.value)}
                placeholder="Address"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.pickup_note}
                onChange={(e) =>
                  updateFormField("pickup_note", e.target.value)
                }
                placeholder="Pickup note e.g. Main lobby"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    updateFormField("is_active", e.target.checked)
                  }
                />
                Active hotel
              </label>
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
                {editingId ? "Update hotel" : "Create hotel"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading hotels...</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Hotel</th>
                  <th className="py-3 pr-4 font-medium">Zone</th>
                  <th className="py-3 pr-4 font-medium">Area</th>
                  <th className="py-3 pr-4 font-medium">Pickup Note</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((hotel) => (
                  <tr
                    key={hotel.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {hotel.name}
                    </td>

                    <td className="py-3 pr-4">
                      {hotel.zone_name || getZoneName(hotel.zone) || "-"}
                    </td>

                    <td className="py-3 pr-4">{hotel.area || "-"}</td>

                    <td className="py-3 pr-4">{hotel.pickup_note || "-"}</td>

                    <td className="py-3 pr-4">
                      <span
                        className={
                          hotel.is_active
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {hotel.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(hotel)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(hotel.id)}
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
                      No hotels found.
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