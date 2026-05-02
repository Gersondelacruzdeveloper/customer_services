import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type LanguageCode = "en" | "es" | "fr" | "de" | "it" | "pt";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { Excursion, Reservation, Vehicle, Guide, Hotel, Provider } from "../types/types";

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function getExcursionById(id: string, excursions: Excursion[]) {
  return excursions.find((item: Excursion) => item.id === id);
}

export function getHotelById(id: number, hotels: Hotel[]) {
  return hotels.find((item: Hotel) => item.id === id);
}

export function getVehicleById(id: string, vehicles: Vehicle[]) {
  return vehicles.find((item: Vehicle) => item.id === id);
}

export function getGuideById(guides: Guide[], id?: string) {
  return guides.find((item: Guide) => item.id === id);
}

export function getProviderName(providerId: string, providers: Provider[]) {
  return providers.find((item: Provider) => item.id === providerId)?.name ?? "Unknown";
}

export function totalPax(r: Reservation) {
  return r.adults + r.children;
}

export function recommendVehicles(groupSize: number, vehicles: Vehicle[]) {
  return vehicles
    .filter((v) => v.active && v.capacity >= groupSize)
    .sort((a, b) => a.capacity - b.capacity);
}
export function recommendedGuideForLanguages(groupLanguages: LanguageCode[], guides: Guide[]) {
  const counts = groupLanguages.reduce<Record<string, number>>((acc, lang) => {
    acc[lang] = (acc[lang] ?? 0) + 1;
    return acc;
  }, {});

  return [...guides]
    .filter((guide) => guide.active)
    .sort((a, b) => {
      const scoreA = a.languages.reduce((sum:any, lang:any) => sum + (counts[lang] ?? 0), 0);
      const scoreB = b.languages.reduce((sum:any, lang:any) => sum + (counts[lang] ?? 0), 0);
      return scoreB - scoreA;
    })[0];
}


export function formatCaribbeanTime(time?: string) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}



export function getDefaultPickupTime(excursionId?: number, hotelId?: number) {
  if (!excursionId || !hotelId) return "";

  // Example rules. Change these IDs/times to match your real data.
  const pickupRules: Record<string, string> = {
    // "excursionId-hotelId": "HH:MM"
    "1-1": "07:00",
    "1-2": "07:15",
    "1-3": "07:30",

    "2-1": "06:30",
    "2-2": "06:45",
    "2-3": "07:00",
  };

  return pickupRules[`${excursionId}-${hotelId}`] ?? "";
}

