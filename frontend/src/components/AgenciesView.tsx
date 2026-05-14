import { useEffect, useMemo, useState } from "react";
import {
  createAgency,
  deleteAgency,
  getAgencies,
  updateAgency,
} from "../lib/api";
import type { Agency } from "../types/types";
const emptyForm: Agency = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  notes: "",
  is_active: true,
};

export function AgenciesView() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [form, setForm] = useState<Agency>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgencies();
  }, []);

  async function loadAgencies() {
    try {
      setLoading(true);
      const data = (await getAgencies()) as Agency[]
      setAgencies(data);
    } catch (error) {
      console.error("Error loading agencies:", error);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return agencies;

    return agencies.filter((agency) =>
      [
        agency.name,
        agency.contact_name,
        agency.phone,
        agency.email,
        agency.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, agencies]);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(agency: Agency) {
    setForm({
      id: agency.id,
      name: agency.name,
      contact_name: agency.contact_name ?? "",
      phone: agency.phone ?? "",
      email: agency.email ?? "",
      notes: agency.notes ?? "",
      is_active: agency.is_active ?? true,
    });

    setEditingId(agency.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Agency>(
    field: K,
    value: Agency[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: form.name,
      contact_name: form.contact_name || "",
      phone: form.phone || "",
      email: form.email || "",
      notes: form.notes || "",
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateAgency(editingId, payload);
      } else {
        await createAgency(payload);
      }

      await loadAgencies();
      closeForm();
    } catch (error: any) {
      console.error("Error saving agency:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this agency?"
    );

    if (!confirmed) return;

    try {
      await deleteAgency(id);
      setAgencies((prev) => prev.filter((agency) => agency.id !== id));
    } catch (error: any) {
      console.error("Error deleting agency:", error.response?.data ?? error);
    }
  }

return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agencias</h3>

          <p className="text-sm text-slate-500">
            Gestiona agencias, socios, contactos y fuentes de referencias.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar agencias..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:w-64"
          />

          <button
            type="button"
            onClick={openCreateForm}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Agregar agencia
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              {editingId ? "Editar agencia" : "Agregar agencia"}
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
              placeholder="Nombre de la agencia"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.contact_name}
              onChange={(e) =>
                updateFormField("contact_name", e.target.value)
              }
              placeholder="Nombre del contacto"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.phone}
              onChange={(e) => updateFormField("phone", e.target.value)}
              placeholder="Teléfono"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              type="email"
              value={form.email}
              onChange={(e) => updateFormField("email", e.target.value)}
              placeholder="Correo electrónico"
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
              Agencia activa
            </label>

            <textarea
              value={form.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
              placeholder="Notas"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:col-span-2 lg:col-span-3"
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
              {editingId ? "Actualizar agencia" : "Crear agencia"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="py-6 text-sm text-slate-500">
            Cargando agencias...
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((agency) => (
                <div
                  key={agency.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {agency.name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Contacto: {agency.contact_name || "-"}
                      </p>
                    </div>

                    <span
                      className={
                        agency.is_active
                          ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {agency.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Teléfono
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {agency.phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Correo electrónico
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {agency.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(agency)}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(agency.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No se encontraron agencias.
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Agencia</th>
                    <th className="py-3 pr-4 font-medium">Contacto</th>
                    <th className="py-3 pr-4 font-medium">Teléfono</th>
                    <th className="py-3 pr-4 font-medium">
                      Correo electrónico
                    </th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                    <th className="py-3 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((agency) => (
                    <tr
                      key={agency.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {agency.name}
                      </td>

                      <td className="py-3 pr-4">
                        {agency.contact_name || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        {agency.phone || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        {agency.email || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={
                            agency.is_active
                              ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {agency.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(agency)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(agency.id)}
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
                        No se encontraron agencias.
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