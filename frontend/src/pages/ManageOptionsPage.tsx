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
          {items.length} items
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
          className="w-full flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={loading || !newValue.trim()}
          className="w-full rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 sm:text-base">
            No items yet
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
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingValue("");
                      }}
                      className="w-full rounded-xl bg-slate-200 px-4 py-2 text-slate-700"
                    >
                      Cancel
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
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Delete "${item.name}"?`
                        );
                        if (!confirmed) return;
                        await onDelete(item.id);
                      }}
                      className="w-full rounded-xl bg-red-600 px-4 py-2 text-white sm:w-auto"
                    >
                      Delete
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
      setMessage("Failed to load data.");
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
      setMessage("Something went wrong.");
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
                Manage Survey Options
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Create, edit, and delete Hotels, Guides, Excursions, and Tour
                Operators
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
            title="Hotels"
            items={hotels}
            newValue={newHotel}
            setNewValue={setNewHotel}
            loading={loading}
            onCreate={async () => {
              if (!newHotel.trim()) return;
              await runAction(async () => {
                await createHotel(newHotel.trim(), token);
                setNewHotel("");
              }, "Hotel created successfully.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateHotel(id, name.trim(), token);
              }, "Hotel updated successfully.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteHotel(id, token);
              }, "Hotel deleted successfully.");
            }}
          />

          <CrudSection
            title="Guides"
            items={guides}
            newValue={newGuide}
            setNewValue={setNewGuide}
            loading={loading}
            onCreate={async () => {
              if (!newGuide.trim()) return;
              await runAction(async () => {
                await createGuide(newGuide.trim(), token);
                setNewGuide("");
              }, "Guide created successfully.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateGuide(id, name.trim(), token);
              }, "Guide updated successfully.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteGuide(id, token);
              }, "Guide deleted successfully.");
            }}
          />

          <CrudSection
            title="Excursions"
            items={excursions}
            newValue={newExcursion}
            setNewValue={setNewExcursion}
            loading={loading}
            onCreate={async () => {
              if (!newExcursion.trim()) return;
              await runAction(async () => {
                await createExcursion(newExcursion.trim(), token);
                setNewExcursion("");
              }, "Excursion created successfully.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateExcursion(id, name.trim(), token);
              }, "Excursion updated successfully.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteExcursion(id, token);
              }, "Excursion deleted successfully.");
            }}
          />

          <CrudSection
            title="Tour Operators"
            items={operators}
            newValue={newOperator}
            setNewValue={setNewOperator}
            loading={loading}
            onCreate={async () => {
              if (!newOperator.trim()) return;
              await runAction(async () => {
                await createOperator(newOperator.trim(), token);
                setNewOperator("");
              }, "Tour operator created successfully.");
            }}
            onUpdate={async (id, name) => {
              await runAction(async () => {
                await updateOperator(id, name.trim(), token);
              }, "Tour operator updated successfully.");
            }}
            onDelete={async (id) => {
              await runAction(async () => {
                await deleteOperator(id, token);
              }, "Tour operator deleted successfully.");
            }}
          />
        </div>
      </div>
    </div>
  );
}