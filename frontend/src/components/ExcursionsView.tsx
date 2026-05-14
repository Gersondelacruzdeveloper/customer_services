import { useEffect, useMemo, useState } from "react";
import {
  createRExcursion,
  deleteRExcursion,
  getRExcursions,
  getProviders,
  updateRExcursion,
  importExcursionsExcel,
} from "../lib/api";

type Provider = {
  id?: number;
  name: string;
};

type Excursion = {
  id?: number;
  name: string;
  description: string;
  default_sale_price: string;
  currency: string;
  default_provider: number | null;
  is_active: boolean;

  default_provider_name?: string;
};

const emptyForm: Excursion = {
  name: "",
  description: "",
  default_sale_price: "0.00",
  currency: "USD",
  default_provider: null,
  is_active: true,
};

export function ExcursionsView() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<Excursion>(emptyForm);
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

      const result = await importExcursionsExcel(file);

      await loadExcursions();

      if (result.errors?.length) {
        console.warn("Errores de importación:", result.errors);
        alert(
          `Se importaron ${result.created_or_updated} excursiones con ${result.errors.length} errores.`,
        );
      } else {
        alert(`Se importaron ${result.created_or_updated} excursiones correctamente.`);
      }
    } catch (error: any) {
      console.error("Error al importar:", error.response?.data ?? error);
      alert("Error al importar el archivo Excel de excursiones.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function loadInitialData() {
    try {
      setLoading(true);

      const [excursionsData, providersData] = await Promise.all([
        getRExcursions() as Promise<Excursion[]>,
        getProviders() as Promise<Provider[]>,
      ]);

      setExcursions(excursionsData);
      setProviders(providersData);
    } catch (error) {
      console.error("Error cargando excursiones:", error);
      setExcursions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadExcursions() {
    const data = (await getRExcursions()) as Excursion[];
    setExcursions(data);
  }

  const getProviderName = (id?: number | null) => {
    if (!id) return "";
    return providers.find((p) => p.id === id)?.name ?? "";
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return excursions;

    return excursions.filter((item) =>
      [
        item.name,
        item.description,
        item.default_provider_name,
        getProviderName(item.default_provider),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, excursions, providers]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      default_provider: providers[0]?.id ?? null,
    });

    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: Excursion) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      default_sale_price: item.default_sale_price ?? "0.00",
      currency: item.currency ?? "USD",
      default_provider: item.default_provider ?? null,
      is_active: item.is_active ?? true,
    });

    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof Excursion>(
    field: K,
    value: Excursion[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: form.name,
      description: form.description || "",
      default_sale_price: form.default_sale_price || "0.00",
      currency: form.currency || "USD",
      default_provider: form.default_provider || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateRExcursion(editingId, payload);
      } else {
        await createRExcursion(payload);
      }

      await loadExcursions();
      closeForm();
    } catch (error: any) {
      console.error("Error guardando excursión:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    if (!window.confirm("¿Estás seguro de que deseas eliminar esta excursión?"))
      return;

    try {
      await deleteRExcursion(id);
      setExcursions((prev) => prev.filter((e) => e.id !== id));
    } catch (error: any) {
      console.error("Error eliminando excursión:", error.response?.data ?? error);
    }
  }

return (
  <div className="space-y-4 p-3 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Excursiones</h3>
          <p className="text-sm text-slate-500">
            Gestiona excursiones, precios y proveedores.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar excursiones..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:w-64"
          />

          <button
            onClick={openCreateForm}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Agregar excursión
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
              {editingId ? "Editar excursión" : "Agregar excursión"}
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
              placeholder="Nombre de la excursión"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <input
              value={form.default_sale_price}
              onChange={(e) =>
                updateFormField("default_sale_price", e.target.value)
              }
              placeholder="Precio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <select
              value={form.default_provider ?? ""}
              onChange={(e) =>
                updateFormField(
                  "default_provider",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Sin proveedor</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <textarea
              value={form.description}
              onChange={(e) => updateFormField("description", e.target.value)}
              placeholder="Descripción"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 sm:col-span-2 lg:col-span-3"
            />

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateFormField("is_active", e.target.checked)
                }
              />
              Activo
            </label>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 sm:w-auto"
            >
              Cancelar
            </button>

            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white sm:w-auto">
              {editingId ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Cargando...</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{e.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Proveedor:{" "}
                        {e.default_provider_name ||
                          getProviderName(e.default_provider) ||
                          "Sin proveedor"}
                      </p>
                    </div>

                    <span
                      className={
                        e.is_active
                          ? "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {e.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">Precio</p>
                    <p className="text-base font-bold text-slate-900">
                      ${e.default_sale_price}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(e)}
                      className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  No se encontraron excursiones.
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4">Nombre</th>
                    <th className="py-3 pr-4">Precio</th>
                    <th className="py-3 pr-4">Proveedor</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 pr-4 font-semibold">{e.name}</td>
                      <td className="py-3 pr-4">${e.default_sale_price}</td>
                      <td className="py-3 pr-4">
                        {e.default_provider_name ||
                          getProviderName(e.default_provider)}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={
                            e.is_active
                              ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {e.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(e)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(e.id)}
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
                        colSpan={5}
                        className="py-6 text-center text-slate-500"
                      >
                        No se encontraron excursiones.
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