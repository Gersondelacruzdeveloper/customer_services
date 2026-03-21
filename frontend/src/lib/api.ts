const API_BASE =
  (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  "https://ecoadventures-backend-a5a2f60ff421.herokuapp.com/api";
  
type LoginResponse = {
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

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return handleJson<LoginResponse>(res);
}

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE}/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleJson<{
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
  }>(res);
}

export async function getHotels() {
  const res = await fetch(`${API_BASE}/hotels/`);
  return handleJson<OptionItem[]>(res);
}

export async function getGuides() {
  const res = await fetch(`${API_BASE}/guides/`);
  return handleJson<OptionItem[]>(res);
}

export async function getExcursions() {
  const res = await fetch(`${API_BASE}/excursions/`);
  return handleJson<OptionItem[]>(res);
}

export async function getOperators() {
  const res = await fetch(`${API_BASE}/operators/`);
  return handleJson<OptionItem[]>(res);
}

export async function submitSurvey(payload: {
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
}) {
  const res = await fetch(`${API_BASE}/surveys/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Survey submit error:", data);
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export async function getDashboardStats(token: string) {
  const res = await fetch(`${API_BASE}/dashboard-stats/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleJson<DashboardStats>(res);
}