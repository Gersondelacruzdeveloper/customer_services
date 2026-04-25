export type LanguageCode = "es" | "en" | "fr" | "de" | "pt" | "it" | "ru";

type TourGuide = {
  id: string;
  name: string;
  languages: LanguageCode[];
  dailyRate: number;
  phone?: string;
  active: boolean;
};

export type ProviderType = "boat" | "bus" | "minibus" | "support_driver" | "activity";

export type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  active: boolean;
  notes?: string;
};

export type Vehicle = {
  id: string;
  providerId: string;
  name: string;
  capacity: number;
  costPerService: number;
  kind: "bus" | "minibus" | "support_driver";
  active: boolean;
};

export type Hotel = {
  id: string;
  name: string;
  zone: string;
  pickupMinutesFromHub: number;
  pickupTimes: Record<string, string>; 
};

export type Excursion = {
  id: string;
  name: string;
  defaultStartTime: string;
  meetingPoint: string;
  providerOptions: {
    providerId: string;
    defaultPrice: number;
  }[];
  active: boolean;
};

export type Reservation = {
  id: string;
  source: "nexus" | "manual";
  locator: string;
  leadName: string;
  excursionId: string;
  hotelId: string;
  serviceDate: string;
  pickupTime: string;
  adults: number;
  children: number;
  language: LanguageCode;
  agency?: string;
  providerPriceOverride?: number;
  notes?: string;
};

export type Assignment = {
  id: string;
  excursionId: string;
  serviceDate: string;
  vehicleId: string;
  guideId?: string;
  assignedPeople: number;
  estimatedCost: number;
};

type UploadedImport = {
  id: string;
  filename: string;
  importedAt: string;
  rows: number;
  source: "nexus";
  status: "success" | "warning";
};

export type Guide = {
  id: string;
  name: string;
  languages: string[];
  dailyRate: number;
  active: boolean;
};