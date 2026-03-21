import React, { useEffect, useMemo, useState } from "react";
import {
  getExcursions,
  getGuides,
  getHotels,
  getOperators,
  submitSurvey,
  type OptionItem,
} from "../lib/api";

const ratings = [
  { value: 1, label: "Poor", emoji: "😞" },
  { value: 2, label: "Fair", emoji: "😐" },
  { value: 3, label: "Good", emoji: "🙂" },
  { value: 4, label: "Excellent", emoji: "😍" },
] as const;

const categories = [
  { key: "punctuality", label: "Punctuality", icon: "🕒" },
  { key: "transport", label: "Transport", icon: "🚌" },
  { key: "guide_rating", label: "Guide", icon: "🧑‍🏫" },
  { key: "food", label: "Food", icon: "🍽️" },
] as const;

type RatingKey = (typeof categories)[number]["key"];

export default function SatisfactionQuestionnaire() {
  const [form, setForm] = useState({
    excursion: "",
    hotel: "",
    date: "",
    participants: "",
    clientName: "",
    roomNo: "",
    tourOperator: "",
    guideName: "",
    punctuality: 0,
    transport: 0,
    guide_rating: 0,
    food: 0,
    comments: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [hotels, setHotels] = useState<OptionItem[]>([]);
  const [guides, setGuides] = useState<OptionItem[]>([]);
  const [excursions, setExcursions] = useState<OptionItem[]>([]);
  const [operators, setOperators] = useState<OptionItem[]>([]);

  useEffect(() => {
    Promise.all([
      getHotels(),
      getGuides(),
      getExcursions(),
      getOperators(),
    ])
      .then(([hotelsData, guidesData, excursionsData, operatorsData]) => {
        setHotels(hotelsData);
        setGuides(guidesData);
        setExcursions(excursionsData);
        setOperators(operatorsData);
      })
      .catch(() => {
        setMessage("Failed to load form options.");
      });
  }, []);

  const hotelId = useMemo(
    () => hotels.find((item) => item.name === form.hotel)?.id ?? null,
    [hotels, form.hotel]
  );

  const guideId = useMemo(
    () => guides.find((item) => item.name === form.guideName)?.id ?? null,
    [guides, form.guideName]
  );

  const excursionId = useMemo(
    () => excursions.find((item) => item.name === form.excursion)?.id ?? null,
    [excursions, form.excursion]
  );

  const operatorId = useMemo(
    () => operators.find((item) => item.name === form.tourOperator)?.id ?? null,
    [operators, form.tourOperator]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (name: RatingKey, value: number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!hotelId || !guideId || !excursionId || !operatorId) {
      setMessage("Please select valid options from the suggestion lists.");
      return;
    }

    setLoading(true);

    try {
      await submitSurvey({
        excursion: excursionId,
        hotel: hotelId,
        date: form.date,
        participants: Number(form.participants) || 0,
        client_name: form.clientName,
        room_no: form.roomNo,
        tour_operator: operatorId,
        guide: guideId,
        punctuality: form.punctuality,
        transport: form.transport,
        guide_rating: form.guide_rating,
        food: form.food,
        comments: form.comments,
      });

      setMessage("Survey saved successfully.");

      setForm({
        excursion: "",
        hotel: "",
        date: "",
        participants: "",
        clientName: "",
        roomNo: "",
        tourOperator: "",
        guideName: "",
        punctuality: 0,
        transport: 0,
        guide_rating: 0,
        food: 0,
        comments: "",
      });
    } catch {
      setMessage("Failed to save survey.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white shadow-xl">
          <div className="rounded-t-3xl bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-4">
              <img
                src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
                className="h-14 w-14"
              />
              <div>
                <h1 className="text-xl font-bold">Customer Satisfaction Survey</h1>
                <p className="text-sm text-slate-300">Help us improve our service</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AutocompleteField
                label="Excursion"
                value={form.excursion}
                onChange={(v) => setForm((p) => ({ ...p, excursion: v }))}
                options={excursions.map((x) => x.name)}
              />

              <AutocompleteField
                label="Hotel"
                value={form.hotel}
                onChange={(v) => setForm((p) => ({ ...p, hotel: v }))}
                options={hotels.map((x) => x.name)}
              />

              <Field
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />

              <Field
                label="Participants"
                name="participants"
                type="number"
                value={form.participants}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Customer Name"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
              />

              <Field
                label="Room Number"
                name="roomNo"
                value={form.roomNo}
                onChange={handleChange}
              />

              <AutocompleteField
                label="Tour Operator"
                value={form.tourOperator}
                onChange={(v) => setForm((p) => ({ ...p, tourOperator: v }))}
                options={operators.map((x) => x.name)}
              />

              <AutocompleteField
                label="Guide"
                value={form.guideName}
                onChange={(v) => setForm((p) => ({ ...p, guideName: v }))}
                options={guides.map((x) => x.name)}
              />
            </div>

            <div className="space-y-4">
              {categories.map((item) => (
                <div key={item.key} className="rounded-2xl border p-4">
                  <p className="mb-3 font-semibold">
                    {item.icon} {item.label}
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ratings.map((r) => {
                      const selected = form[item.key] === r.value;

                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => handleRatingChange(item.key, r.value)}
                          className={`rounded-xl border p-3 text-center ${
                            selected ? "bg-slate-900 text-white" : "bg-white"
                          }`}
                        >
                          <div className="text-xl">{r.emoji}</div>
                          <div className="text-sm">{r.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block font-semibold">Comments</label>
              <textarea
                name="comments"
                value={form.comments}
                onChange={handleChange}
                className="w-full rounded-2xl border p-3"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              {message && <p className="text-sm text-green-600">{message}</p>}

              <button
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Survey"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border px-3 py-2"
      />
    </div>
  );
}

function AutocompleteField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-semibold">{label}</label>

      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-xl border px-3 py-2"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow">
          {filtered.map((o) => (
            <div
              key={o}
              onMouseDown={() => onChange(o)}
              className="cursor-pointer px-3 py-2 hover:bg-gray-100"
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}