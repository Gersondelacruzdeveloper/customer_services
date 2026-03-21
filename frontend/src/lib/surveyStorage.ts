import { sampleSurveys, type SurveyRecord } from "../data/sampleSurveys";

const STORAGE_KEY = "eco-adventures-surveys";

export function getSurveys(): SurveyRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSurveys));
    return sampleSurveys;
  }

  try {
    return JSON.parse(raw) as SurveyRecord[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSurveys));
    return sampleSurveys;
  }
}

export function saveSurveys(surveys: SurveyRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
}

export function addSurvey(survey: SurveyRecord) {
  const surveys = getSurveys();
  surveys.push(survey);
  saveSurveys(surveys);
}

export function clearSurveys() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportSurveysToJson() {
  const surveys = getSurveys();
  const blob = new Blob([JSON.stringify(surveys, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "surveys.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importSurveysFromJson(file: File): Promise<SurveyRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as SurveyRecord[];
        saveSurveys(parsed);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}