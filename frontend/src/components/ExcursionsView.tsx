import { useEffect, useMemo, useState } from "react";
import {
  createRExcursion,
  deleteRExcursion,
  getRExcursions,
  getProviders,
  updateRExcursion,
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
      console.error("Error loading excursions:", error);
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
      console.error("Error saving excursion:", error.response?.data ?? error);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    if (!window.confirm("Are you sure you want to delete this excursion?"))
      return;

    try {
      await deleteRExcursion(id);
      setExcursions((prev) => prev.filter((e) => e.id !== id));
    } catch (error: any) {
      console.error("Error deleting excursion:", error.response?.data ?? error);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Excursions</h3>

            <p className="text-sm text-slate-500">
              Manage excursions, pricing and providers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search excursions..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
            />

            <button
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add excursion
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4 flex justify-between">
              <h4 className="font-semibold text-slate-900">
                {editingId ? "Edit excursion" : "Add excursion"}
              </h4>

              <button
                type="button"
                onClick={closeForm}
                className="text-sm text-slate-500"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                placeholder="Excursion name"
                required
                className="rounded-2xl border px-4 py-2.5 text-sm"
              />

              <input
                value={form.default_sale_price}
                onChange={(e) =>
                  updateFormField("default_sale_price", e.target.value)
                }
                placeholder="Price"
                className="rounded-2xl border px-4 py-2.5 text-sm"
              />

              <select
                value={form.default_provider ?? ""}
                onChange={(e) =>
                  updateFormField(
                    "default_provider",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="rounded-2xl border px-4 py-2.5 text-sm"
              >
                <option value="">No provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <textarea
                value={form.description}
                onChange={(e) => updateFormField("description", e.target.value)}
                placeholder="Description"
                rows={3}
                className="rounded-2xl border px-4 py-2.5 text-sm md:col-span-2 lg:col-span-3"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    updateFormField("is_active", e.target.checked)
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border px-4 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button className="rounded-2xl bg-slate-950 text-white px-4 py-2.5 text-sm font-semibold">
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading...</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
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
                        {e.is_active ? "Active" : "Inactive"}
                    </span>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(e)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
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
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No excursions found.
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
