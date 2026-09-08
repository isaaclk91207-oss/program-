import { Request } from "express";

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  email: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ─── Transport Request Types ─────────────────────────────────────────────────

export interface CreateTransportRequestDto {
  passengerId: string;
  department: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
}

export interface AssignDriverDto {
  driverId: string;
  vehicleId: string;
}

export interface TransportRequestResponse {
  id: string;
  passengerId: string;
  passengerName: string;
  department: string;
  driverId: string | null;
  driverName: string | null;
  vehicleId: string | null;
  vehiclePlate: string | null;
  status: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  qrScanStatus: string | null;
  feedbackStatus: string | null;
  createdAt: string;
}

// ─── QR Verification Types ───────────────────────────────────────────────────

export interface QRScanPayload {
  qrValue: string;
}

export interface QRVerificationResult {
  valid: boolean;
  vehiclePlate?: string;
  error?: string;
}

// ─── Driver Types ────────────────────────────────────────────────────────────

export interface CreateDriverDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  certLevel?: string;
  licenseNo?: string;
  englishLevel?: string;
}

export interface UpdateDriverDto {
  name?: string;
  phone?: string;
  certLevel?: string;
  certStatus?: string;
  validUntil?: string;
  status?: string;
  englishLevel?: string;
  accidentFree?: string;
  credits?: number;
  currentVehicleId?: string;
}

export interface DriverResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  certLevel: string;
  certStatus: string;
  validUntil: string | null;
  status: string;
  joinedDate: string;
  accidentFree: string | null;
  englishLevel: string | null;
  credits: number;
  currentVehicleId: string | null;
  currentVehiclePlate: string | null;
  score: number;
  rating: number;
}

// ─── Vehicle Types ───────────────────────────────────────────────────────────

export interface CreateVehicleDto {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

export interface UpdateVehicleDto {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  status?: string;
}

export interface VehicleResponse {
  id: string;
  plate: string;
  qrValue: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
}

// ─── Assessment Types ────────────────────────────────────────────────────────

export interface UpdateAssessmentDto {
  written: number;
  practical: Record<string, number>;
  operational: Record<string, number>;
}

export interface AssessmentResponse {
  id: string;
  driverId: string;
  written: number;
  practical: Record<string, number>;
  operational: Record<string, number>;
  feedbackAvg: number;
  overallScore: number;
  certLevel: string;
}

// ─── Feedback Types ──────────────────────────────────────────────────────────

export interface CreateFeedbackDto {
  rating: number;
  comment: string;
  tags: string[];
}

export interface FeedbackResponse {
  id: string;
  requestId: string;
  passengerId: string;
  passengerName: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  rating: number;
  comment: string;
  tags: string[];
  department: string;
  date: string;
}

// ─── Check-In Types ──────────────────────────────────────────────────────────

export interface CheckInDto {
  vehiclePlate: string;
  location: string;
  remark?: string;
}

export interface CheckOutDto {
  vehiclePlate: string;
  location: string;
  remark?: string;
}

export interface VehicleCheckinResponse {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  requestId: string;
  checkInLocation: string | null;
  checkInTime: string | null;
  checkInRemark: string | null;
  checkOutLocation: string | null;
  checkOutTime: string | null;
  checkOutRemark: string | null;
  status: string;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  read: boolean;
  relatedRequestId: string | null;
  createdAt: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  qrPendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  feedbackSubmittedRequests: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  activeVehicles: number;
  requestsByStatus: { status: string; count: number }[];
  requestsByDepartment: { department: string; count: number }[];
  recentRequests: TransportRequestResponse[];
}

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface UpdateSettingsDto {
  writtenWeight?: number;
  practicalWeight?: number;
  operationalWeight?: number;
  feedbackWeight?: number;
  passMarks?: Record<string, number>;
}

// ─── Netpros/Wialon Types ────────────────────────────────────────────────────

export interface WialonLoginResponse {
  eid: string;
  user?: { nm: string };
  error?: number;
}

export interface WialonUnit {
  nm: string;
  id: number;
  cls: number;
}

export interface WialonTrip {
  t: number;
  f: number;
  t1: number;
  t2: number;
  dur: number;
  dis: number;
}

export interface WialonPosition {
  t: number;
  f: number;
  y: number;
  x: number;
  c: number;
  z: number;
  s: number;
  sc: number;
}

export interface WialonUnitPos extends WialonUnit {
  pos?: WialonPosition;
  lmsg?: Record<string, unknown>;
}

export interface LiveVehicleLocation {
  vehicleId: string;
  plate: string;
  gpsDeviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: number;
  onActiveTrip: boolean;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
