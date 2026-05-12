import React, { useEffect, useMemo, useState } from "react";
import {
  getExcursions,
  getGuides,
  getHotels,
  getOperators,
  submitSurvey,
} from "../lib/api";
import type { OptionItem } from "../types/types";
import { getText } from "../lib/i18n";
import type { SupportedLanguage } from "../lib/translations";

type Props = {
  lang: SupportedLanguage;
  setLang?: (value: SupportedLanguage) => void;
};

export default function SatisfactionQuestionnaire({ lang, setLang }: Props) {
  const t = getText(lang);

  const ratings = [
    { value: 1, label: t.poor, emoji: "😞" },
    { value: 2, label: t.fair, emoji: "😐" },
    { value: 3, label: t.good, emoji: "🙂" },
    { value: 4, label: t.excellent, emoji: "😍" },
  ] as const;

  const categories = [
    { key: "punctuality", label: t.punctuality, icon: "🕒" },
    { key: "transport", label: t.transport, icon: "🚌" },
    { key: "guide_rating", label: t.guideRating, icon: "🧑‍🏫" },
    { key: "food", label: t.food, icon: "🍽️" },
  ] as const;

  type RatingKey = (typeof categories)[number]["key"];

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
  const [submitted, setSubmitted] = useState(false);

  const languageOptions: { value: SupportedLanguage; label: string }[] = [
    { value: "en", label: "🇺🇸 English" },
    { value: "es", label: "🇪🇸 Español" },
    { value: "pt", label: "🇧🇷 Português" },
    { value: "fr", label: "🇫🇷 Français" },
    { value: "de", label: "🇩🇪 Deutsch" },
    { value: "it", label: "🇮🇹 Italiano" },
    { value: "nl", label: "🇳🇱 Nederlands" },
    { value: "ru", label: "🇷🇺 Русский" },
    { value: "pl", label: "🇵🇱 Polski" },
    { value: "zh", label: "🇨🇳 中文" },
  ];

  useEffect(() => {
    Promise.all([getHotels(), getGuides(), getExcursions(), getOperators()])
      .then(([hotelsData, guidesData, excursionsData, operatorsData]) => {
        const hotelOptions = hotelsData
          .filter((h) => h.id !== undefined)
          .map((h) => ({
            id: h.id!,
            name: h.name,
          }));

        const excursionOptions = excursionsData.map((e) => ({
          id: Number(e.id),
          name: e.name,
        }));

        setHotels(hotelOptions);
        setGuides(guidesData);
        setExcursions(excursionOptions);
        setOperators(operatorsData);
      })
      .catch(() => {
        setMessage(t.failedToLoadOptions);
      });
  }, [t.failedToLoadOptions]);

  const hotelId = useMemo(
    () => hotels.find((item) => item.name === form.hotel)?.id ?? null,
    [hotels, form.hotel],
  );

  const guideId = useMemo(
    () => guides.find((item) => item.name === form.guideName)?.id ?? null,
    [guides, form.guideName],
  );

  const excursionId = useMemo(
    () => excursions.find((item) => item.name === form.excursion)?.id ?? null,
    [excursions, form.excursion],
  );

  const operatorId = useMemo(
    () => operators.find((item) => item.name === form.tourOperator)?.id ?? null,
    [operators, form.tourOperator],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      setMessage(t.pleaseSelectValidOptions);
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

      setSubmitted(true);

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
      setMessage(t.failedToSaveSurvey);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <img
            src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
            className="mx-auto mb-4 h-16"
          />

          <h1 className="text-2xl font-bold text-slate-900">{t.thankYou}</h1>

          <p className="mt-3 text-slate-600">{t.feedbackSubmitted}</p>

          <p className="mt-2 text-sm text-slate-500">{t.appreciateHelp}</p>

          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-white"
          >
            {t.submitAnotherResponse}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white shadow-xl"
        >
          <div className="rounded-t-3xl bg-slate-900 p-6 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="https://ecoadventurespc.com/wp-content/uploads/2018/12/cropped-logo1.png"
                  className="h-14 w-14"
                />

                <div>
                  <h1 className="text-xl font-bold">
                    {t.customerSatisfactionSurvey}
                  </h1>
                  <p className="text-sm text-slate-300">
                    {t.helpUsImproveService}
                  </p>
                </div>
              </div>

              {setLang && (
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as SupportedLanguage)}
                  className="rounded-2xl border border-white/20 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AutocompleteField
                label={t.excursion}
                value={form.excursion}
                onChange={(v) => setForm((p) => ({ ...p, excursion: v }))}
                options={excursions.map((x) => x.name)}
              />

              <AutocompleteField
                label={t.hotel}
                value={form.hotel}
                onChange={(v) => setForm((p) => ({ ...p, hotel: v }))}
                options={hotels.map((x) => x.name)}
              />

              <Field
                label={t.date}
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />

              <Field
                label={t.participants}
                name="participants"
                type="number"
                value={form.participants}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label={t.customerName}
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
              />

              <Field
                label={t.roomNumber}
                name="roomNo"
                value={form.roomNo}
                onChange={handleChange}
              />

              <AutocompleteField
                label={t.tourOperator}
                value={form.tourOperator}
                onChange={(v) => setForm((p) => ({ ...p, tourOperator: v }))}
                options={operators.map((x) => x.name)}
              />

              <AutocompleteField
                label={t.guide}
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
              <label className="mb-2 block font-semibold">{t.comments}</label>
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
                {loading ? t.saving : t.saveSurvey}
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
    o.toLowerCase().includes(value.toLowerCase()),
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
