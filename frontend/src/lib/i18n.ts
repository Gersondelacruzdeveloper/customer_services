import { translations, type SupportedLanguage } from "./translations";

const supportedLanguages: SupportedLanguage[] = [
  "en",
  "es",
  "pt",
  "fr",
  "de",
  "it",
  "nl",
  "ru",
  "pl",
  "zh",
];

export function getDeviceLanguage(): SupportedLanguage {
  const raw = navigator.language?.toLowerCase() || "en";

  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("pt")) return "pt";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("de")) return "de";
  if (raw.startsWith("it")) return "it";
  if (raw.startsWith("nl")) return "nl";
  if (raw.startsWith("ru")) return "ru";
  if (raw.startsWith("pl")) return "pl";
  if (raw.startsWith("zh")) return "zh";

  return "en";
}

export function getText(lang: SupportedLanguage) {
  return translations[lang] || translations.en;
}