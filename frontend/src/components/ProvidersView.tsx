import { useEffect, useMemo, useState } from "react";
import {
  createProvider,
  deleteProvider,
  getProviders,
  updateProvider,
} from "../lib/api";

type Provider = {
  id?: number;
  name: string;
  provider_type: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_active: boolean;
};

const emptyForm: Provider = {
  name: "",
  provider_type: "other",
  phone: "",
  email: "",
  address: "",
  notes: "",
  is_active: true,
};

const providerTypes = [
  ["transport", "Transporte"],
  ["excursion", "Excursión"],
  ["food", "Comida"],
  ["boat", "Bote"],
  ["guide", "Guía"],
  ["hotel", "Hotel"],
  ["other", "Otro"],
];

export function ProvidersView() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<Provider>(emptyForm);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      setLoading(true);
      const data = await getProviders() as Provider[];
      setProviders(data);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return providers;

    return providers.filter((provider) =>
      [
        provider.name,
        provider.provider_type,
        provider.phone,
        provider.email,
        provider.address,
        provider.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, providers]);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(provider: Provider) {
    setForm({
      id: provider.id,
      name: provider.name,
      provider_type: provider.provider_type ?? "other",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
      address: provider.address ?? "",
      notes: provider.notes ?? "",
      is_active: provider.is_active ?? true,
    });

    setEditingId(provider.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Provider>(
    field: K,
    value: Provider[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: form.name,
      provider_type: form.provider_type,
      phone: form.phone || "",
      email: form.email || "",
      address: form.address || "",
      notes: form.notes || "",
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateProvider(editingId, payload);
      } else {
        await createProvider(payload);
      }

      await loadProviders();
      closeForm();
    } catch (error: any) {
      console.error("Error guardando proveedor:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este proveedor?"
    );

    if (!confirmed) return;

    try {
      await deleteProvider(id);
      setProviders((prev) => prev.filter((provider) => provider.id !== id));
    } catch (error: any) {
      console.error("Error eliminando proveedor:", error.response?.data ?? error);
    }
  }

  function getProviderTypeLabel(value: string) {
    return providerTypes.find(([key]) => key === value)?.[1] ?? value;
  }


  return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Proveedores</h3>
          <p className="text-sm text-slate-500">
            Gestiona suplidores, operadores, botes, guías y otros proveedores.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proveedores..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:w-64"
          />

          <button
            type="button"
            onClick={openCreateForm}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Agregar proveedor
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
              {editingId ? "Editar proveedor" : "Agregar proveedor"}
            </h4>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-slate-500"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={form.name}
              onChange={(e) => updateFormField("name", e.target.value)}
              placeholder="Nombre del proveedor"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <select
              value={form.provider_type}
              onChange={(e) =>
                updateFormField("provider_type", e.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              {providerTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

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

            <input
              value={form.address}
              onChange={(e) => updateFormField("address", e.target.value)}
              placeholder="Dirección"
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
              Proveedor activo
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
              {editingId ? "Actualizar proveedor" : "Crear proveedor"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="py-6 text-sm text-slate-500">
            Cargando proveedores...
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filtered.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {provider.name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {getProviderTypeLabel(provider.provider_type)}
                      </p>
                    </div>

                    <span
                      className={
                        provider.is_active
                          ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {provider.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Teléfono
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {provider.phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium text-slate-500">
                        Correo
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {provider.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(provider)}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(provider.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No se encontraron proveedores.
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Proveedor</th>
                    <th className="py-3 pr-4 font-medium">Tipo</th>
                    <th className="py-3 pr-4 font-medium">Teléfono</th>
                    <th className="py-3 pr-4 font-medium">Correo</th>
                    <th className="py-3 pr-4 font-medium">Estado</th>
                    <th className="py-3 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((provider) => (
                    <tr
                      key={provider.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-semibold text-slate-900">
                        {provider.name}
                      </td>

                      <td className="py-3 pr-4">
                        {getProviderTypeLabel(provider.provider_type)}
                      </td>

                      <td className="py-3 pr-4">
                        {provider.phone || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        {provider.email || "-"}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={
                            provider.is_active
                              ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {provider.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(provider)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(provider.id)}
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
                        No se encontraron proveedores.
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