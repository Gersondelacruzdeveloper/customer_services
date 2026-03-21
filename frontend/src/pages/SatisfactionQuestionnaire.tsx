import React, { useState } from "react";
import { addSurvey } from "../lib/surveyStorage";

const ratings = [
  { value: 1, label: "Poor", emoji: "😞" },
  { value: 2, label: "Fair", emoji: "😐" },
  { value: 3, label: "Good", emoji: "🙂" },
  { value: 4, label: "Excellent", emoji: "😍" },
] as const;

const categories = [
  { key: "punctuality", label: "Punctuality", icon: "🕒" },
  { key: "transport", label: "Transport", icon: "🚌" },
  { key: "guide", label: "Guide", icon: "🧑‍🏫" },
  { key: "food", label: "Food", icon: "🍽️" },
] as const;

// 👇 Suggested data (later this will come from Django)
const hotelOptions = [
  "Hard Rock",
  "Majestic",
  "Riu Bambu",
  "Riu Palace",
  "Barceló Bávaro",
  "Melia Caribe Beach",
  "Lopesan Costa Bávaro",
];

const guideOptions = ["Carlos", "Luis", "Maria", "Pedro"];
const excursionOptions = ["Saona Island", "Samana", "Buggies"];
const operatorOptions = ["Eco Adventures", "Coming2", "TUI", "Amstar"];

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
    guide: 0,
    food: 0,
    comments: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (name: RatingKey, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const survey = {
      id: crypto.randomUUID(),
      ...form,
      participants: Number(form.participants) || 0,
      createdAt: new Date().toISOString(),
    };

    addSurvey(survey);

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
      guide: 0,
      food: 0,
      comments: "",
    });

    setTimeout(() => setMessage(""), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white shadow-xl"
        >
          {/* HEADER */}
          <div className="rounded-t-3xl bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-4">
              <img
                src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
                className="h-14 w-14"
              />
              <div>
                <h1 className="text-xl font-bold">
                  Customer Satisfaction Survey
                </h1>
                <p className="text-sm text-slate-300">
                  Help us improve our service
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="p-6 space-y-6">
            {/* TOP FIELDS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AutocompleteField
                label="Excursion"
                value={form.excursion}
                onChange={(v) =>
                  setForm((p) => ({ ...p, excursion: v }))
                }
                options={excursionOptions}
              />

              <AutocompleteField
                label="Hotel"
                value={form.hotel}
                onChange={(v) =>
                  setForm((p) => ({ ...p, hotel: v }))
                }
                options={hotelOptions}
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
                onChange={(v) =>
                  setForm((p) => ({ ...p, tourOperator: v }))
                }
                options={operatorOptions}
              />

              <AutocompleteField
                label="Guide"
                value={form.guideName}
                onChange={(v) =>
                  setForm((p) => ({ ...p, guideName: v }))
                }
                options={guideOptions}
              />
            </div>

            {/* RATINGS */}
            <div className="space-y-4">
              {categories.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border p-4"
                >
                  <p className="mb-3 font-semibold">
                    {item.icon} {item.label}
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ratings.map((r) => {
                      const selected =
                        form[item.key] === r.value;

                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() =>
                            handleRatingChange(
                              item.key,
                              r.value
                            )
                          }
                          className={`rounded-xl border p-3 text-center ${
                            selected
                              ? "bg-slate-900 text-white"
                              : "bg-white"
                          }`}
                        >
                          <div className="text-xl">
                            {r.emoji}
                          </div>
                          <div className="text-sm">
                            {r.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* COMMENTS */}
            <div>
              <label className="block mb-2 font-semibold">
                Comments
              </label>
              <textarea
                name="comments"
                value={form.comments}
                onChange={handleChange}
                className="w-full rounded-2xl border p-3"
                rows={4}
              />
            </div>

            {/* SUBMIT */}
            <div className="flex justify-between items-center">
              {message && (
                <p className="text-green-600 text-sm">
                  {message}
                </p>
              )}

              <button className="bg-slate-900 text-white px-6 py-3 rounded-xl">
                Save Survey
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: any) {
  return (
    <div>
      <label className="block mb-1 text-sm font-semibold">
        {label}
      </label>
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
}: any) {
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o: string) =>
    o.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block mb-1 text-sm font-semibold">
        {label}
      </label>

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
        <div className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow">
          {filtered.map((o: string) => (
            <div
              key={o}
              onMouseDown={() => onChange(o)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}