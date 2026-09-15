export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DriverProfile {
  userId: string;
  certLevel: string;
  certStatus: string;
  validUntil: string | null;
  licenseNo: string | null;
  joinedDate: string;
  accidentFree: string | null;
  englishLevel: string | null;
  credits: number;
  currentVehicleId: string | null;
  status: string;
}

export interface PassengerProfile {
  userId: string;
  department: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  qrValue: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: "ACTIVE" | "MAINTENANCE" | "RETIRED";
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  version?: "v1" | "v2";
}

export interface Driver {
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
  employeeId?: string;
  wialonDriverId?: number;
  version?: "v1" | "v2";
}

export interface TransportRequest {
  id: string;
  requestNumber?: string;
  passengerId: string;
  passengerName: string;
  department: string;
  driverId: string | null;
  driverName: string | null;
  vehicleId: string | null;
  vehiclePlate: string | null;
  status: TransportStatus;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  noOfPeople: number;
  wayUsers: string | null;
  section: string | null;
  serviceType: string | null;
  purpose: string | null;
  returnTime: string | null;
  note: string | null;
  qrScanStatus: string | null;
  feedbackStatus: string | null;
  createdAt: string;
  version?: "v1" | "v2";
  hasActiveCheckin?: boolean;
}

export function formatRequestId(id: string, requestNumber?: string): string {
  if (requestNumber) return requestNumber;
  if (id.startsWith("TRQ-")) return id;
  return `TRQ-${id.substring(0, 4).toUpperCase()}`;
}

export type TransportStatus =
  | "PENDING"
  | "ASSIGNED"
  | "QR_PENDING"
  | "PICK_UP_SCANNED"
  | "IN_PROGRESS"
  | "DROP_OFF_SCANNED"
  | "FEEDBACK_SUBMITTED"
  | "COMPLETED";

export interface TransportRequestListResponse {
  requests: TransportRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Feedback {
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

export interface Notification {
  id: string;
  recipientId: string;
  recipientRole: string;
  title: string;
  message: string;
  read: boolean;
  relatedRequestId: string | null;
  createdAt: string;
}

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
  recentRequests: TransportRequest[];
  driverHours: { driverId: string; driverName: string; tripHours: number; actualHours: number }[];
  totalTripHours: number;
  totalActualHours: number;

}

export interface VehicleCheckin {
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

export interface Assessment {
  id: string;
  driverId: string;
  written: number;
  practical: Record<string, number>;
  operational: Record<string, number>;
  feedbackAvg: number;
  overallScore: number;
  certLevel: string;
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

export interface QRVerificationResult {
  valid: boolean;
  vehiclePlate?: string;
  error?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface ReportTemplate {
  id: number;
  name: string;
  type: "unit" | "driver";
  description: string;
}

export interface ReportTemplatesResponse {
  resourceId: number;
  templates: ReportTemplate[];
}

export interface ReportTable {
  tableName: string;
  tableIndex: number;
  header: string[];
  rowCount: number;
  rows: Record<string, string | number>[];
}

export interface UnitReportResponse {
  unitId: number;
  templateId: number;
  templateName: string;
  interval: { from: number; to: number };
  tables: ReportTable[];
}

export interface DriverReportResponse {
  driverId: string;
  templateId: number;
  templateName: string;
  interval: { from: number; to: number };
  tables: ReportTable[];
}

export interface ReportQueryParams {
  templateId?: number;
  timeFrom: number;
  timeTo: number;
  sid: string;
}
