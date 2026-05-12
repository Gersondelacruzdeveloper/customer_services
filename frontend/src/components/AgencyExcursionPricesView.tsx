// src/components/AgencyExcursionPricesView.tsx

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";

import {
  getAgencies,
  getRExcursions,
  getAgencyExcursionPrices,
  createAgencyExcursionPrice,
  updateAgencyExcursionPrice,
  deleteAgencyExcursionPrice,
} from "../lib/api";

type Option = {
  id?: number;
  name: string;
};

type AgencyExcursionPrice = {
  id?: number;
  agency: number;
  agency_name?: string;
  excursion: number;
  excursion_name?: string;
  adult_price: string;
  child_price: string;
  currency: string;
  is_active: boolean;
};

const emptyForm: AgencyExcursionPrice = {
  agency: 0,
  excursion: 0,
  adult_price: "0.00",
  child_price: "0.00",
  currency: "USD",
  is_active: true,
};

export function AgencyExcursionPricesView() {
  const [prices, setPrices] = useState<AgencyExcursionPrice[]>([]);
  const [agencies, setAgencies] = useState<Option[]>([]);
  const [excursions, setExcursions] = useState<Option[]>([]);
  const [form, setForm] = useState<AgencyExcursionPrice>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [priceData, agencyDataRaw, excursionDataRaw] = await Promise.all([
        getAgencyExcursionPrices(),
        getAgencies(),
        getRExcursions(),
      ]);

      const agencyData = agencyDataRaw.map((item: any) => ({
        id: typeof item.id === "string" ? Number(item.id) : item.id,
        name: item.name,
      }));

      const excursionData = excursionDataRaw.map((item: any) => ({
        id: typeof item.id === "string" ? Number(item.id) : item.id,
        name: item.name,
      }));

      setPrices(priceData as AgencyExcursionPrice[]);
      setAgencies(agencyData);
      setExcursions(excursionData);

      setForm((prev) => ({
        ...prev,
        agency: agencyData[0]?.id ?? 0,
        excursion: excursionData[0]?.id ?? 0,
      }));
    } catch (error) {
      console.error("Error cargando datos de precios de agencias:", error);
    }
  }

  function openCreateForm() {
    setForm({
      ...emptyForm,
      agency: agencies[0]?.id ?? 0,
      excursion: excursions[0]?.id ?? 0,
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: AgencyExcursionPrice) {
    setForm(item);
    setEditingId(item.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      agency: Number(form.agency),
      excursion: Number(form.excursion),
      adult_price: form.adult_price || "0.00",
      child_price: form.child_price || "0.00",
      currency: form.currency || "USD",
      is_active: form.is_active,
    };

    if (editingId) {
      await updateAgencyExcursionPrice(editingId, payload);
    } else {
      await createAgencyExcursionPrice(payload);
    }

    await loadData();
    closeForm();
  }

  async function handleDelete(id?: number) {
    if (!id) return;

    const confirmed = window.confirm(
      "¿Eliminar este precio de agencia?"
    );

    if (!confirmed) return;

    await deleteAgencyExcursionPrice(id);
    setPrices((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Precios de Excursiones por Agencia
            </h3>

            <p className="text-sm text-slate-500">
              Configura precios de adultos y niños para cada agencia y excursión.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Agregar precio
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Agencia
                </label>

                <select
                  value={form.agency || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      agency: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  required
                >
                  <option value="">Seleccionar agencia</option>

                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Excursión
                </label>

                <select
                  value={form.excursion || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      excursion: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                  required
                >
                  <option value="">Seleccionar excursión</option>

                  {excursions.map((excursion) => (
                    <option key={excursion.id} value={excursion.id}>
                      {excursion.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Precio adulto
                </label>

                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.adult_price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      adult_price: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Precio niño
                </label>

                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.child_price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      child_price: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Moneda
                </label>

                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                Activo
              </label>

              <div className="flex gap-3">
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
                  {editingId ? "Actualizar precio" : "Crear precio"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Agencia</th>
                <th className="px-4 py-3">Excursión</th>
                <th className="px-4 py-3">Adulto</th>
                <th className="px-4 py-3">Niño</th>
                <th className="px-4 py-3">Moneda</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {prices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{item.agency_name}</td>

                  <td className="px-4 py-3">{item.excursion_name}</td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {item.adult_price}
                    </span>
                  </td>

                  <td className="px-4 py-3">{item.child_price}</td>

                  <td className="px-4 py-3">{item.currency}</td>

                  <td className="px-4 py-3">
                    {item.is_active ? "Activo" : "Inactivo"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="mr-2 inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {prices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No se encontraron precios de agencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}