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
  id?: number;
  name: string;
  zone: number | null;
  area: string;
  address: string;
  pickup_note: string;
  is_active: boolean;
  zone_name?: string;
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
  id: number;
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
  lead_name?:string;
  excursion_id?:string | number;
  hotel_id?:string | number;
  service_date?:string;
  pickup_time?:string;
  infants?:number;
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

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type OptionItem = {
  id: number;
  name: string;
};

export type DashboardStats = {
  totalSurveys: number;
  totalParticipants: number;
  categoryAverages: {
    punctuality: number;
    transport: number;
    guide: number;
    food: number;
  };
  guidePerformance: {
    name: string;
    score: number;
    total: number;
  }[];
  hotelCounts: {
    name: string;
    value: number;
  }[];
  excursionCounts: {
    name: string;
    value: number;
  }[];
  happiestGuide: {
    name: string;
    score: number;
    total: number;
  } | null;
  topHotel: {
    name: string;
    value: number;
  } | null;
  comments: {
    comments: string;
    client_name: string;
    hotel: string;
  }[];
};

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type SurveyPayload = {
  excursion: number | null;
  hotel: number | null;
  date: string;
  participants: number;
  client_name: string;
  room_no: string;
  tour_operator: number | null;
  guide: number | null;
  punctuality: number;
  transport: number;
  guide_rating: number;
  food: number;
  comments: string;
};

export type Zone = {
  id?: number;
  name: string;
  code: string;
  description: string;
};

export type PickupTime = {
  id?: number;
  excursion: number;
  hotel: number;
  zone?: number | null;
  time: string;
  notes: string;

  excursion_name?: string;
  hotel_name?: string;
  zone_name?: string;
};


export type Agency = {
  id?: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  is_active: boolean;
};
