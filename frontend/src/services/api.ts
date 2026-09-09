import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  LoginRequest,
  LoginResponse,
  User,
  Driver,
  Vehicle,
  TransportRequest,
  TransportRequestListResponse,
  Feedback,
  Notification,
  DashboardStats,
  QRVerificationResult,
  Assessment,
  VehicleCheckin,
  LiveVehicleLocation,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
});

const apiV2 = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE_URL ?? "/api/v1",
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("pccp_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: { code: string; message: string } }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pccp_token");
      localStorage.removeItem("pccp_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

// ─── Drivers ───────────────────────────────────────────────────────────────

export async function getDrivers(params?: {
  status?: string;
  search?: string;
  certStatus?: string;
}): Promise<Driver[]> {
  const res = await api.get<Driver[]>("/drivers", { params });
  return res.data;
}

export async function getDriver(id: string) {
  const res = await api.get(`/drivers/${id}`);
  return res.data;
}

export async function createDriver(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  const res = await api.post("/drivers", data);
  return res.data;
}

export async function updateDriver(id: string, data: Partial<Driver>) {
  const res = await api.put(`/drivers/${id}`, data);
  return res.data;
}

export async function deleteDriver(id: string) {
  const res = await api.delete(`/drivers/${id}`);
  return res.data;
}

export async function getAssessments(params?: {
  driverId?: string;
  certLevel?: string;
}) {
  const res = await api.get("/drivers/assessments", { params });
  return res.data;
}

export async function getPassengers(params?: { search?: string }) {
  const res = await api.get("/drivers/passengers", { params });
  return res.data;
}

export async function updateAssessment(
  driverId: string,
  data: { written: number; practical: Record<string, number>; operational: Record<string, number> }
): Promise<Assessment> {
  const res = await api.put<Assessment>(`/drivers/${driverId}/assessment`, data);
  return res.data;
}

export async function getDriverFeedback(driverId: string): Promise<Feedback[]> {
  const res = await api.get<Feedback[]>(`/drivers/${driverId}/feedback`);
  return res.data;
}

export async function getDrivingHours(driverId?: string): Promise<{ driverId: string; tripHours: number; tripCount: number; actualHours: number; actualTripCount: number; gpsHours: number; gpsTripCount: number }[]> {
  const url = driverId ? `/drivers/hours?driverId=${driverId}` : "/drivers/hours";
  const res = await api.get(url);
  return res.data;
}

export async function getCertSummary() {
  const res = await api.get("/drivers/cert-summary");
  return res.data;
}

// ─── Vehicles ──────────────────────────────────────────────────────────────

export async function getVehicles(params?: {
  status?: string;
  search?: string;
}): Promise<Vehicle[]> {
  const res = await api.get<Vehicle[]>("/vehicles", { params });
  return res.data;
}

export async function getVehicle(id: string) {
  const res = await api.get(`/vehicles/${id}`);
  return res.data;
}

export async function createVehicle(data: {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
}) {
  const res = await api.post("/vehicles", data);
  return res.data;
}

export async function updateVehicle(id: string, data: Partial<Vehicle>) {
  const res = await api.put(`/vehicles/${id}`, data);
  return res.data;
}

export async function deleteVehicle(id: string) {
  const res = await api.delete(`/vehicles/${id}`);
  return res.data;
}

export async function getVehicleByQr(qrValue: string) {
  const res = await api.get(`/vehicles/qr/${encodeURIComponent(qrValue)}`);
  return res.data;
}

// ─── Transport Requests ────────────────────────────────────────────────────

export async function getRequests(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TransportRequestListResponse> {
  const res = await api.get<TransportRequestListResponse>("/requests", { params });
  return res.data;
}

export async function getRequest(id: string) {
  const res = await api.get(`/requests/${id}`);
  return res.data;
}

export async function createRequest(data: {
  department: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  noOfPeople?: number;
  wayUsers?: string;
  section?: string;
  serviceType?: string;
  purpose?: string;
  returnTime?: string;
  note?: string;
}): Promise<TransportRequest> {
  const res = await api.post<TransportRequest>("/requests", data);
  return res.data;
}

export async function assignDriver(
  requestId: string,
  data: { driverId: string; vehicleId: string }
): Promise<TransportRequest> {
  const res = await api.put<TransportRequest>(`/requests/${requestId}/assign`, data);
  return res.data;
}

// ─── Trips ─────────────────────────────────────────────────────────────────

export async function verifyQR(data: { qrValue: string }): Promise<QRVerificationResult> {
  const res = await api.post<QRVerificationResult>("/trips/qr-verify", data);
  return res.data;
}

export async function pickupQRScan(requestId: string) {
  const res = await api.post(`/trips/${requestId}/qr-pickup`);
  return res.data;
}

export async function dropoffQRScan(requestId: string) {
  const res = await api.post(`/trips/${requestId}/qr-dropoff`);
  return res.data;
}

export async function driverCheckIn(data: {
  vehiclePlate: string;
  location: string;
  remark?: string;
}) {
  const res = await api.post("/trips/checkin", data);
  return res.data;
}

export async function driverCheckOut(data: {
  vehiclePlate: string;
  location: string;
  remark?: string;
}) {
  const res = await api.post("/trips/checkout", data);
  return res.data;
}

export async function getDriverTrips(status?: string) {
  const res = await api.get("/trips/driver", { params: { status } });
  return res.data;
}

// ─── V2 Driver API (backend-v2 on port 3002) ────────────────────────────────

export async function getDriverTripsV2(driverId: string) {
  const res = await apiV2.get("/trips/driver", { params: { driverId } });
  return res.data;
}

export async function getDriverV2(driverId: string) {
  const res = await apiV2.get(`/drivers/${driverId}`);
  return res.data;
}

export async function getAllDriversV2() {
  const res = await apiV2.get("/drivers");
  return res.data;
}

export async function assignDriverV2(
  requestId: string,
  data: { driverId: string; vehicleId: string }
) {
  const res = await apiV2.post(`/transport-requests/${requestId}/assign`, data);
  return res.data;
}

export async function getAllVehiclesV2() {
  const res = await apiV2.get("/vehicles");
  return res.data;
}

export async function getAllRequestsV2() {
  const res = await apiV2.get("/transport-requests");
  return res.data;
}

export async function getPassengerTrips(status?: string) {
  const res = await api.get("/trips/passenger", { params: { status } });
  return res.data;
}

export async function getTripDetail(id: string) {
  const res = await api.get(`/trips/${id}`);
  return res.data;
}

// ─── Feedback ──────────────────────────────────────────────────────────────

export async function submitFeedback(
  requestId: string,
  data: { rating: number; comment: string; tags: string[] }
): Promise<Feedback> {
  const res = await api.post<Feedback>(`/feedback/${requestId}`, data);
  return res.data;
}

export async function getAllFeedback(params?: {
  driverId?: string;
  rating?: number;
}): Promise<Feedback[]> {
  const res = await api.get<Feedback[]>("/feedback", { params });
  return res.data;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
  const res = await api.get<Notification[]>("/notifications", {
    params: { unreadOnly: unreadOnly?.toString() },
  });
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.put("/notifications/read-all");
  return res.data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await api.get<{ count: number }>("/notifications/unread-count");
  return res.data;
}

export async function createNotification(data: {
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  relatedRequestId?: string;
}): Promise<Notification> {
  const res = await api.post<Notification>("/notifications", data);
  return res.data;
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/admin/dashboard");
  return res.data;
}

export async function getSettings() {
  const res = await api.get("/admin/settings");
  return res.data;
}

export async function updateSettings(data: Record<string, unknown>) {
  const res = await api.put("/admin/settings", data);
  return res.data;
}

export async function exportData(type: string) {
  const res = await api.get(`/admin/export/${type}`);
  return res.data;
}

export async function getNetprosStatus() {
  const res = await api.get("/admin/netpros/status");
  return res.data;
}

export async function triggerNetprosSync() {
  const res = await api.post("/admin/netpros/sync");
  return res.data;
}

export async function getLiveVehicleLocations(): Promise<LiveVehicleLocation[]> {
  const res = await api.get<LiveVehicleLocation[]>("/admin/gps/live");
  return res.data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getReportTemplates() {
  const res = await apiV2.get("/reports/templates");
  return res.data;
}

export async function getUnitReport(unitId: number, params: {
  templateId?: number;
  timeFrom: number;
  timeTo: number;
  sid?: string;
}) {
  const res = await apiV2.get(`/reports/unit/${unitId}`, { params });
  return res.data;
}

export async function getDriverReport(driverId: string, params: {
  timeFrom: number;
  timeTo: number;
  sid?: string;
}) {
  const res = await apiV2.get(`/reports/driver/${driverId}`, { params });
  return res.data;
}

export default api;
