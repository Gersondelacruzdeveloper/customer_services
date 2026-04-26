import { useEffect, useMemo, useState } from "react";
import {
  createProviderService,
  deleteProviderService,
  getProviderServices,
  getProviders,
  updateProviderService,
} from "../lib/api";

type Provider = {
  id?: number;
  name: string;
};

type ProviderService = {
  id?: number;
  provider: number;
  name: string;
  category: string;
  description: string;
  cost_price: string;
  currency: string;
  price_type: string;
  is_active: boolean;

  provider_name?: string;
};

const emptyForm: ProviderService = {
  provider: 0,
  name: "",
  category: "",
  description: "",
  cost_price: "0.00",
  currency: "USD",
  price_type: "per_person",
  is_active: true,
};

const priceTypes = [
  ["per_person", "Per person"],
  ["per_trip", "Per trip"],
  ["per_group", "Per group"],
  ["fixed", "Fixed"],
];

const currencies = ["USD", "DOP", "EUR"];

export function ProviderServicesView() {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<ProviderService>(emptyForm);
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

      const [servicesData, providersData] = await Promise.all([
        getProviderServices(),
        getProviders(),
      ]);

      setServices(servicesData);
      setProviders(providersData);

      setForm((prev) => ({
        ...prev,
        provider: providersData[0]?.id ?? 0,
      }));
    } catch (error) {
      console.error("Error loading provider services:", error);
      setServices([]);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadServices() {
    try {
      const data = await getProviderServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading provider services:", error);
      setServices([]);
    }
  }

  const getProviderName = (id?: number | null) => {
    if (!id) return "";
    return providers.find((provider) => provider.id === id)?.name ?? "";
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return services;

    return services.filter((service) =>
      [
        service.name,
        service.category,
        service.description,
        service.provider_name,
        getProviderName(service.provider),
        service.cost_price,
        service.currency,
        service.price_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, services, providers]);

  function openCreateForm() {
    setForm({
      ...emptyForm,
      provider: providers[0]?.id ?? 0,
    });

    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(service: ProviderService) {
    setForm({
      id: service.id,
      provider: service.provider,
      name: service.name,
      category: service.category ?? "",
      description: service.description ?? "",
      cost_price: service.cost_price ?? "0.00",
      currency: service.currency ?? "USD",
      price_type: service.price_type ?? "per_person",
      is_active: service.is_active ?? true,
      provider_name: service.provider_name,
    });

    setEditingId(service.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm({
      ...emptyForm,
      provider: providers[0]?.id ?? 0,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function updateFormField<K extends keyof ProviderService>(
    field: K,
    value: ProviderService[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      provider: Number(form.provider),
      name: form.name,
      category: form.category || "",
      description: form.description || "",
      cost_price: form.cost_price || "0.00",
      currency: form.currency || "USD",
      price_type: form.price_type || "per_person",
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateProviderService(editingId, payload);
      } else {
        await createProviderService(payload);
      }

      await loadServices();
      closeForm();
    } catch (error: any) {
      console.error(
        "Error saving provider service:",
        error.response?.data ?? error
      );
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this provider service?"
    );

    if (!confirmed) return;

    try {
      await deleteProviderService(id);
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (error: any) {
      console.error(
        "Error deleting provider service:",
        error.response?.data ?? error
      );
    }
  }

  function getPriceTypeLabel(value: string) {
    return priceTypes.find(([key]) => key === value)?.[1] ?? value;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Provider Services
            </h3>

            <p className="text-sm text-slate-500">
              Manage prices for transport, boats, food, guides and excursion suppliers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services..."
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add service
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
                {editingId ? "Edit service" : "Add service"}
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
              <select
                value={form.provider}
                onChange={(e) =>
                  updateFormField("provider", Number(e.target.value))
                }
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>

              <input
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                placeholder="Service name e.g. Bus 25 seats"
                required
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                value={form.category}
                onChange={(e) => updateFormField("category", e.target.value)}
                placeholder="Category e.g. transport, food, boat"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost_price}
                onChange={(e) => updateFormField("cost_price", e.target.value)}
                placeholder="Cost price"
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              />

              <select
                value={form.currency}
                onChange={(e) => updateFormField("currency", e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>

              <select
                value={form.price_type}
                onChange={(e) => updateFormField("price_type", e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                {priceTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    updateFormField("is_active", e.target.checked)
                  }
                />
                Active service
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateFormField("description", e.target.value)
                }
                placeholder="Description"
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm md:col-span-2"
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
                {editingId ? "Update service" : "Create service"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">
              Loading provider services...
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Provider</th>
                  <th className="py-3 pr-4 font-medium">Service</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Cost</th>
                  <th className="py-3 pr-4 font-medium">Price Type</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {service.provider_name || getProviderName(service.provider)}
                    </td>

                    <td className="py-3 pr-4">{service.name}</td>
                    <td className="py-3 pr-4">{service.category || "-"}</td>

                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {service.cost_price} {service.currency}
                    </td>

                    <td className="py-3 pr-4">
                      {getPriceTypeLabel(service.price_type)}
                    </td>

                    <td className="py-3 pr-4">
                      <span
                        className={
                          service.is_active
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(service)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
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
                      colSpan={7}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No provider services found.
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