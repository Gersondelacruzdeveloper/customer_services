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

type MeResponse = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
};

type SurveyPayload = {
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

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json();
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function bearerHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/* -------------------- Auth -------------------- */

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
    headers: bearerHeader(token),
  });

  return handleJson<MeResponse>(res);
}

/* -------------------- Generic CRUD helpers -------------------- */

async function listOptions(resource: string) {
  const res = await fetch(`${API_BASE}/${resource}/`);
  return handleJson<OptionItem[]>(res);
}

async function createOption(resource: string, name: string, token: string) {
  const res = await fetch(`${API_BASE}/${resource}/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });

  return handleJson<OptionItem>(res);
}

async function updateOption(
  resource: string,
  id: number,
  name: string,
  token: string
) {
  const res = await fetch(`${API_BASE}/${resource}/${id}/`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });

  return handleJson<OptionItem>(res);
}

async function deleteOption(resource: string, id: number, token: string) {
  const res = await fetch(`${API_BASE}/${resource}/${id}/`, {
    method: "DELETE",
    headers: bearerHeader(token),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Delete failed");
  }
}

/* -------------------- Public lists -------------------- */

export async function getHotels() {
  return listOptions("hotels");
}

export async function getGuides() {
  return listOptions("guides");
}

export async function getExcursions() {
  return listOptions("excursions");
}

export async function getOperators() {
  return listOptions("operators");
}

/* -------------------- Hotels CRUD -------------------- */

export async function createHotel(name: string, token: string) {
  return createOption("hotels", name, token);
}

export async function updateHotel(id: number, name: string, token: string) {
  return updateOption("hotels", id, name, token);
}

export async function deleteHotel(id: number, token: string) {
  return deleteOption("hotels", id, token);
}

/* -------------------- Guides CRUD -------------------- */

export async function createGuide(name: string, token: string) {
  return createOption("guides", name, token);
}

export async function updateGuide(id: number, name: string, token: string) {
  return updateOption("guides", id, name, token);
}

export async function deleteGuide(id: number, token: string) {
  return deleteOption("guides", id, token);
}

/* -------------------- Excursions CRUD -------------------- */

export async function createExcursion(name: string, token: string) {
  return createOption("excursions", name, token);
}

export async function updateExcursion(id: number, name: string, token: string) {
  return updateOption("excursions", id, name, token);
}

export async function deleteExcursion(id: number, token: string) {
  return deleteOption("excursions", id, token);
}

/* -------------------- Operators CRUD -------------------- */

export async function createOperator(name: string, token: string) {
  return createOption("operators", name, token);
}

export async function updateOperator(id: number, name: string, token: string) {
  return updateOption("operators", id, name, token);
}

export async function deleteOperator(id: number, token: string) {
  return deleteOption("operators", id, token);
}

/* -------------------- Surveys -------------------- */

export async function submitSurvey(payload: SurveyPayload) {
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

/* -------------------- Dashboard -------------------- */

export async function getDashboardStats(token: string) {
  const res = await fetch(`${API_BASE}/dashboard-stats/`, {
    headers: bearerHeader(token),
  });

  return handleJson<DashboardStats>(res);
}