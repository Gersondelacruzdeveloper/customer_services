import { useEffect, useMemo, useState } from "react";
import {
  createRHotel,
  deleteRHotel,
  getRHotels,
  getZones,
  updateRHotel,
  importHotelsExcel,
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

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const result = await importHotelsExcel(file);

      await loadHotels();

      if (result.errors?.length) {
        console.warn("Errores de importación:", result.errors);
        alert(
          `Se importaron ${result.created_or_updated} hoteles con ${result.errors.length} errores.`,
        );
      } else {
        alert(`Se importaron ${result.created_or_updated} hoteles correctamente.`);
      }
    } catch (error: any) {
      console.error("Error al importar:", error.response?.data ?? error);
      alert("Error al importar el archivo Excel de hoteles.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function loadInitialData() {
    try {
      setLoading(true);

      const [hotelsData, zonesData] = await Promise.all([
        getRHotels() as Promise<Hotel[]>,
        getZones() as Promise<Zone[]>,
      ]);

      setHotels(hotelsData);
      setZones(zonesData);
    } catch (error) {
      console.error("Error cargando hoteles:", error);
      setHotels([]);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadHotels() {
    try {
      const data = (await getRHotels()) as Hotel[];
      setHotels(data);
    } catch (error) {
      console.error("Error cargando hoteles:", error);
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
      console.error("Error guardando hotel:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este hotel?"
    );

    if (!confirmed) return;

    try {
      await deleteRHotel(id);
      setHotels((prev) => prev.filter((hotel) => hotel.id !== id));
    } catch (error: any) {
      console.error("Error eliminando hotel:", error.response?.data ?? error);
    }
  }

return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Hoteles</h3>

          <p className="text-sm text-slate-500">
            Gestiona hoteles, zonas, direcciones y notas de recogida.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar hoteles..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:w-64"
          />

          <button
            onClick={openCreateForm}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Agregar hotel
          </button>

          <label className="w-full cursor-pointer rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 sm:w-auto">
            Importar Excel
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
          className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              {editingId ? "Editar hotel" : "Agregar hotel"}
            </h4>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={form.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              placeholder="Nombre del hotel"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <select
              value={form.zone ?? ""}
              onChange={(e) =>
                updateFormField(
                  "zone",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Sin zona</option>

              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.code ? `${zone.code} - ${zone.name}` : zone.name}
                </option>
              ))}
            </select>

            <input
              value={form.area}
              onChange={(e) => updateFormField("area", e.target.value)}
              placeholder="Área ej. Bávaro, Cap Cana"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.address}
              onChange={(e) => updateFormField("address", e.target.value)}
              placeholder="Dirección"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.pickup_note}
              onChange={(e) =>
                updateFormField("pickup_note", e.target.value)
              }
              placeholder="Nota de recogida ej. Lobby principal"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateFormField("is_active", e.target.checked)
                }
              />
              Hotel activo
            </label>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
            >
              {editingId ? "Actualizar hotel" : "Crear hotel"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="py-6 text-sm text-slate-500">
            Cargando hoteles...
          </p>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="space-y-3 md:hidden">
              {filtered.map((hotel) => (
                <div
                  key={hotel.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {hotel.name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Zona:{" "}
                        {hotel.zone_name ||
                          getZoneName(hotel.zone) ||
                          "-"}
                      </p>
                    </div>

                    <span
                      className={
                        hotel.is_active
                          ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {hotel.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Área
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {hotel.area || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Nota de recogida
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {hotel.pickup_note || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditForm(hotel)}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(hotel.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No se encontraron hoteles.
                </div>
              )}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Hotel</th>
                    <th className="py-3 pr-4 font-medium">Zona</th>
                    <th className="py-3 pr-4 font-medium">Área</th>
                    <th className="py-3 pr-4 font-medium">
                      Nota de recogida
                    </th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                    <th className="py-3 pr-4 font-medium">Acciones</th>
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
                        {hotel.zone_name ||
                          getZoneName(hotel.zone) ||
                          "-"}
                      </td>

                      <td className="py-3 pr-4">
                        {hotel.area || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        {hotel.pickup_note || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={
                            hotel.is_active
                              ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {hotel.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(hotel)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(hotel.id)}
                            className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Eliminar
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
                        No se encontraron hoteles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);
}