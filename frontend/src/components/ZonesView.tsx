import { useEffect, useMemo, useState } from "react";
import { createZone, deleteZone, getZones, updateZone } from "../lib/api";
import type { Zone } from "../types/types";

const emptyForm: Zone = {
  name: "",
  code: "",
  description: "",
};

export function ZonesView() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState<Zone>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    try {
      setLoading(true);
      const data = (await getZones()) as Zone[];
      setZones(data);
    } catch (error) {
      console.error("Error cargando zonas:", error);
      setZones([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return zones;

    return zones.filter((zone) =>
      [zone.name, zone.code, zone.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, zones]);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(zone: Zone) {
    setForm(zone);
    setEditingId(zone.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Zone>(field: K, value: Zone[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
    };

    try {
      if (editingId) {
        await updateZone(editingId, payload);
      } else {
        await createZone(payload);
      }

      await loadZones();
      closeForm();
    } catch (error: any) {
      console.error("Error guardando zona:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta zona?"
    );

    if (!confirmed) return;

    try {
      await deleteZone(id);
      setZones((prev) => prev.filter((zone) => zone.id !== id));
    } catch (error: any) {
      console.error("Error eliminando zona:", error.response?.data ?? error);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Zonas</h3>

            <p className="text-sm text-slate-500">
              Gestiona zonas de recogida como Bávaro, Cap Cana, Bayahibe, Boca Chica y Juan Dolio.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar zonas..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <button
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Agregar zona
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
                {editingId ? "Editar zona" : "Agregar zona"}
              </h4>

              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancelar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                placeholder="Nombre de la zona"
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.code}
                onChange={(e) => updateFormField("code", e.target.value)}
                placeholder="Código ej. ZONA 1"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.description}
                onChange={(e) => updateFormField("description", e.target.value)}
                placeholder="Descripción"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {editingId ? "Actualizar zona" : "Crear zona"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Cargando zonas...</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Nombre</th>
                  <th className="py-3 pr-4 font-medium">Código</th>
                  <th className="py-3 pr-4 font-medium">Descripción</th>
                  <th className="py-3 pr-4 font-medium">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((zone) => (
                  <tr
                    key={zone.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {zone.name}
                    </td>

                    <td className="py-3 pr-4">{zone.code || "-"}</td>

                    <td className="py-3 pr-4">{zone.description || "-"}</td>

                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(zone)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(zone.id)}
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
                      colSpan={4}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No se encontraron zonas.
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