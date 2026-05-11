const API_BASE =
  (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  "https://ecoadventures-backend-a5a2f60ff421.herokuapp.com/api";
import type { Excursion, Hotel, Reservation } from "../types/types";
import axios from "axios";
import type { SurveyPayload, DashboardStats, MeResponse, LoginResponse, OptionItem} from "../types/types";


export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
function extractData<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

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

export async function getHotels(): Promise<Hotel[]> {
  const res = await axios.get<Hotel[]>(`${API_BASE}/hotels/`);
  return res.data;
}
export async function getGuides() {
  return listOptions("guides");
}


export async function getExcursions(): Promise<Excursion[]> {
  const res = await axios.get<Excursion[]>(`${API_BASE}/excursions/`);
  return res.data;
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

/* -------------------- Reservations CRUD -------------------- */

export async function getReservations() {
  const res = await axios.get(`${API_BASE}/reservations/reservations/`);
  return extractData(res.data);
}

export async function createReservation(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/reservations/`, payload);
  return res.data;
}

export async function updateReservation(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/reservations/${id}/`, payload);
  return res.data;
}

export async function deleteReservation(id: number) {
  await axios.delete(`${API_BASE}/reservations/reservations/${id}/`);
}
/* --------------------Add CRUD helpers for  Zones -------------------- */
export async function getZones() {
  const res = await axios.get(`${API_BASE}/reservations/zones/`);
  return extractData(res.data);
}

export async function createZone(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/zones/`, payload);
  return res.data;
}

export async function updateZone(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/zones/${id}/`, payload);
  return res.data;
}

export async function deleteZone(id: number) {
  await axios.delete(`${API_BASE}/reservations/zones/${id}/`);
}
/* --------------------Add CRUD helpers for  PickupTimes -------------------- */

export async function getPickupTimes() {
  const res = await axios.get(`${API_BASE}/reservations/pickup-times/`);
  return extractData(res.data);
}

export async function createPickupTime(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/pickup-times/`, payload);
  return res.data;
}

export async function updatePickupTime(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/pickup-times/${id}/`, payload);
  return res.data;
}

export async function deletePickupTime(id: number) {
  await axios.delete(`${API_BASE}/reservations/pickup-times/${id}/`);
}

/* --------------------Add CRUD helpers for  Hotels -------------------- */

export async function getRHotels() {
  const res = await axios.get(`${API_BASE}/reservations/hotels/`);
  return extractData(res.data);
}

export async function createRHotel(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/hotels/`, payload);
  return res.data;
}

export async function updateRHotel(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/hotels/${id}/`, payload);
  return res.data;
}

export async function deleteRHotel(id: number) {
  await axios.delete(`${API_BASE}/reservations/hotels/${id}/`);
}
/* --------------------Add CRUD helpers for Excursions -------------------- */


export async function getRExcursions() {
  const res = await axios.get(`${API_BASE}/reservations/excursions/`);
  return extractData(res.data);
}

export async function createRExcursion(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/excursions/`, payload);
  return res.data;
}

export async function updateRExcursion(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/excursions/${id}/`, payload);
  return res.data;
}

export async function deleteRExcursion(id: number) {
  await axios.delete(`${API_BASE}/reservations/excursions/${id}/`);
}
/* --------------------Add CRUD helpers for Providers -------------------- */

export async function getProviders() {
  const res = await axios.get(`${API_BASE}/reservations/providers/`);
  return extractData(res.data);
}

export async function createProvider(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/providers/`, payload);
  return res.data;
}

export async function updateProvider(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/providers/${id}/`, payload);
  return res.data;
}

export async function deleteProvider(id: number) {
  await axios.delete(`${API_BASE}/reservations/providers/${id}/`);
}
/* --------------------Add CRUD helpers for ProviderServices -------------------- */

export async function getProviderServices() {
  const res = await axios.get(`${API_BASE}/reservations/provider-services/`);
  return extractData(res.data);
}

export async function createProviderService(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/provider-services/`, payload);
  return res.data;
}

export async function updateProviderService(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/provider-services/${id}/`, payload);
  return res.data;
}

export async function deleteProviderService(id: number) {
  await axios.delete(`${API_BASE}/reservations/provider-services/${id}/`);
}

/* --------------------Add CRUD helpers for Agencies -------------------- */
export async function getAgencies() {
  const res = await axios.get(`${API_BASE}/reservations/agencies/`);
  return extractData(res.data);
}

export async function createAgency(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/agencies/`, payload);
  return res.data;
}

export async function updateAgency(id: number, payload: any) {
  const res = await axios.put(`${API_BASE}/reservations/agencies/${id}/`, payload);
  return res.data;
}

export async function deleteAgency(id: number) {
  await axios.delete(`${API_BASE}/reservations/agencies/${id}/`);
}

/* --------------------importReservationsExcel -------------------- */
export async function importReservationsExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/reservations/import-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/* --------------------importExcursionsExcel -------------------- */
export async function importExcursionsExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/reservations/excursions/import-excel/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

/* --------------------importHotelsExcel -------------------- */
export async function importHotelsExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/reservations/hotels/import-excel/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/* --------------------importPickupTimesExcel -------------------- */
export async function importPickupTimesExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/reservations/pickup-times/import-excel/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}


/* -------------------- Operations CRUD -------------------- */

export async function getOperations(params?: {
  date?: string;
  excursion?: string | number;
  provider?: string | number;
  status?: string;
}) {
  const res = await axios.get(`${API_BASE}/reservations/operations/`, {
    params,
  });
  return extractData(res.data);
}

export async function createOperation(payload: any) {
  const res = await axios.post(`${API_BASE}/reservations/operations/`, payload);
  return res.data;
}

export async function updateOperation(id: number, payload: any) {
  const res = await axios.put(
    `${API_BASE}/reservations/operations/${id}/`,
    payload,
  );
  return res.data;
}

export async function deleteOperation(id: number) {
  await axios.delete(`${API_BASE}/reservations/operations/${id}/`);
}

export async function markOperationSent(id: number) {
  const res = await axios.post(
    `${API_BASE}/reservations/operations/${id}/mark-sent/`,
  );
  return res.data;
}



export async function getAgencyExcursionPrices() {
  const response = await axios.get(`${API_BASE}/reservations/agency-excursion-prices/`);
  return extractData(response.data);
}

export async function createAgencyExcursionPrice(payload: any) {
  const response = await axios.post(`${API_BASE}/reservations/agency-excursion-prices/`, payload);
  return extractData(response.data);
}

export async function updateAgencyExcursionPrice(
  id: number,
  payload: any,
) {
  const response = await axios.put(
    `${API_BASE}/reservations/agency-excursion-prices/${id}/`,
    payload,
  );

  return extractData(response.data);
}

export async function deleteAgencyExcursionPrice(id: number) {
  const response = await axios.delete(
    `${API_BASE}/reservations/agency-excursion-prices/${id}/`,
  );

  return extractData(response.data);
}


export async function updateAgencyAccess(id: number, data: any) {
  const token = localStorage.getItem("access_token");
  console.log("TOKEN BEING SENT:", token);
  const response = await api.patch(`/reservations/agency-access/${id}/`, data);
  return response.data;
}