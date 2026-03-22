// src/pages/ManageOptionsPage.tsx
import { useEffect, useState } from "react";
import {
  getHotels,
  getGuides,
  getExcursions,
  getOperators,
  createHotel,
  updateHotel,
  deleteHotel,
  createGuide,
  updateGuide,
  deleteGuide,
  createExcursion,
  updateExcursion,
  deleteExcursion,
  createOperator,
  updateOperator,
  deleteOperator,
  type OptionItem,
} from "../lib/api";

type SectionProps = {
  title: string;
  items: OptionItem[];
  newValue: string;
  setNewValue: (value: string) => void;
  onCreate: () => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
};

function CrudSection({
  title,
  items,
  newValue,
  setNewValue,
  onCreate,
  onUpdate,
  onDelete,
  loading = false,
}: SectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 sm:text-sm">
          {items.length} artículos
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Agregar nuevo ${title.toLowerCase().slice(0, -1)}`}
          className="w-full flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={loading || !newValue.trim()}
          className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          Agregar
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 sm:text-base">
            Aún no hay artículos
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              {editingId === item.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  />

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingValue.trim()) return;
                        await onUpdate(item.id, editingValue);
                        setEditingId(null);
                        setEditingValue("");
                      }}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white"
                    >
                      Guardar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingValue("");
                      }}
                      className="w-full rounded-xl bg-slate-200 px-4 py-2 text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="break-words pr-0 font-medium text-slate-800 sm:pr-4">
                    {item.name}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:flex sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingValue(item.name);
                      }}
                      className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white sm:w-auto"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `¿Eliminar "${item.name}"?`
                        );
                        if (!confirmed) return;
                        await onDelete(item.id);
                      }}
                      className="w-full rounded-xl bg-red-600 px-4 py-2 text-white sm:w-auto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ManageOptionsPage() {
  const token = localStorage.getItem("access") || "";

  const [hotels, setHotels] = useState<OptionItem[]>([]);
  const [guides, setGuides] = useState<OptionItem[]>([]);
  const [excursions, setExcursions] = useState<OptionItem[]>([]);
  const [operators, setOperators] = useState<OptionItem[]>([]);

  const [newHotel, setNewHotel] = useState("");
  const [newGuide, setNewGuide] = useState("");
  const [newExcursion, setNewExcursion] = useState("");
  const [newOperator, setNewOperator] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadAll = async () => {
    try {
      const [hotelsData, guidesData, excursionsData, operatorsData] =
        await Promise.all([
          getHotels(),
          getGuides(),
          getExcursions(),
          getOperators(),
        ]);

      setHotels(hotelsData);
      setGuides(guidesData);
      setExcursions(excursionsData);
      setOperators(operatorsData);
    } catch {
      setMessage("Error al cargar los datos.");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runAction = async (
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setLoading(true);
    setMessage("");

    try {
      await action();
      await loadAll();
      setMessage(successMessage);
    } catch (error) {
      console.error(error);
      setMessage("Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl bg-slate-900 p-4 text-white shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
              alt="Eco Adventures"
              className="h-12 w-fit sm:h-14"
            />
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Gestionar opciones de la encuesta
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Crear, editar y eliminar hoteles, guías, excursiones y
                operadores turísticos
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <CrudSection
            title="Hoteles"
            items={hotels}
            newValue={newHotel}
            setNewValue={setNewHotel}
            loading={loading}
            onCreate={async () => {
              if (!newHotel.trim()) return;
              await runAction(async () => {
                await createHotel(newHotel.trim(), token);
                setNewHotel("");
              }, "Hotel creado correctamente.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateHotel(id, name.trim(), token);
              }, "Hotel actualizado correctamente.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteHotel(id, token);
              }, "Hotel eliminado correctamente.");
            }}
          />

          <CrudSection
            title="Guías"
            items={guides}
            newValue={newGuide}
            setNewValue={setNewGuide}
            loading={loading}
            onCreate={async () => {
              if (!newGuide.trim()) return;
              await runAction(async () => {
                await createGuide(newGuide.trim(), token);
                setNewGuide("");
              }, "Guía creada correctamente.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateGuide(id, name.trim(), token);
              }, "Guía actualizada correctamente.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteGuide(id, token);
              }, "Guía eliminada correctamente.");
            }}
          />

          <CrudSection
            title="Excursiones"
            items={excursions}
            newValue={newExcursion}
            setNewValue={setNewExcursion}
            loading={loading}
            onCreate={async () => {
              if (!newExcursion.trim()) return;
              await runAction(async () => {
                await createExcursion(newExcursion.trim(), token);
                setNewExcursion("");
              }, "Excursión creada correctamente.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateExcursion(id, name.trim(), token);
              }, "Excursión actualizada correctamente.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteExcursion(id, token);
              }, "Excursión eliminada correctamente.");
            }}
          />

          <CrudSection
            title="Operadores turísticos"
            items={operators}
            newValue={newOperator}
            setNewValue={setNewOperator}
            loading={loading}
            onCreate={async () => {
              if (!newOperator.trim()) return;
              await runAction(async () => {
                await createOperator(newOperator.trim(), token);
                setNewOperator("");
              }, "Operador turístico creado correctamente.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateOperator(id, name.trim(), token);
              }, "Operador turístico actualizado correctamente.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteOperator(id, token);
              }, "Operador turístico eliminado correctamente.");
            }}
          />
        </div>
      </div>
    </div>
  );
}