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
        console.warn("Errores de importación de horarios:", result.errors);
        alert(
          `Se importaron ${result.created_or_updated} horarios de recogida con ${result.errors.length} errores.`,
        );
      } else {
        alert(
          `Se importaron ${result.created_or_updated} horarios de recogida correctamente.`,
        );
      }
    } catch (error: any) {
      console.error("Error de importación:", error.response?.data ?? error);
      alert("Error al importar el archivo Excel de horarios de recogida.");
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
      console.error("Error cargando horarios de recogida:", error);
      setPickupTimes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPickupTimes() {
    try {
      const data = (await getPickupTimes()) as PickupTime[];
      setPickupTimes(data);
    } catch (error) {
      console.error("Error cargando horarios de recogida:", error);
      setPickupTimes([]);
    }
  }

  const getHotelName = (id: number) => {
    return hotels.find((hotel) => Number(hotel.id) === id)?.name ?? "";
  };

  const getExcursionName = (id: number) => {
    return (
      excursions.find((excursion) => Number(excursion.id) === id)?.name ?? ""
    );
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
      console.error(
        "Error guardando horario de recogida:",
        error.response?.data ?? error
      );
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este horario de recogida?"
    );

    if (!confirmed) return;

    try {
      await deletePickupTime(id);
      setPickupTimes((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      console.error(
        "Error eliminando horario de recogida:",
        error.response?.data ?? error
      );
    }
  }
return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Horarios de Recogida
          </h3>

          <p className="text-sm text-slate-500">
            Gestiona horarios de recogida por excursión y hotel.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar horarios..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:w-64"
          />

          <button
            onClick={openCreateForm}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Agregar horario
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
              {editingId
                ? "Editar horario de recogida"
                : "Agregar horario de recogida"}
            </h4>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={form.excursion}
              onChange={(e) =>
                updateFormField("excursion", Number(e.target.value))
              }
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
              placeholder="Notas"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
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
              {editingId ? "Actualizar horario" : "Crear horario"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="py-6 text-sm text-slate-500">
            Cargando horarios de recogida...
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {item.excursion_name ||
                          getExcursionName(item.excursion)}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Hotel: {item.hotel_name || getHotelName(item.hotel)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {formatCaribbeanTime(item.time)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Zona
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.zone_name || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Notas
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.notes || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditForm(item)}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No se encontraron horarios de recogida.
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Excursión</th>
                    <th className="py-3 pr-4 font-medium">Hotel</th>
                    <th className="py-3 pr-4 font-medium">Zona</th>
                    <th className="py-3 pr-4 font-medium">Hora</th>
                    <th className="py-3 pr-4 font-medium">Notas</th>
                    <th className="py-3 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {item.excursion_name ||
                          getExcursionName(item.excursion)}
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
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
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
                        No se encontraron horarios de recogida.
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