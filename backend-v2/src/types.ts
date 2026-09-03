import { Request } from "express";

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  employeeId: string;
  role: "ADMIN" | "DRIVER";
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// ─── Transport Request Types ─────────────────────────────────────────────────

export interface CreateTransportRequestDto {
  passengerName: string;
  department: string;
  pickupLocation: string;
  destination: string;
  requestDate: string;
}

export interface AssignDriverDto {
  driverId: string;
  vehicleId: string;
}

// ─── QR Scan Types ───────────────────────────────────────────────────────────

export interface QRScanDto {
  tripId: string;
  qrPayload: string;
  eventType: "PICKUP" | "DROPOFF";
}

export interface QRScanResult {
  success: boolean;
  message: string;
  trip?: {
    id: string;
    status: string;
    startTime?: string;
    endTime?: string;
  };
}

// ─── Eco Driving Types ───────────────────────────────────────────────────────

export interface EcoDrivingViolation {
  violationType: string;
  value: number;
  duration: number;
  mileage: number;
  avgSpeed: number;
  penalties: number;
  rank: number;
}

export interface EcoDrivingReportResult {
  unitId: number;
  unitName: string;
  interval: { from: number; to: number };
  violations: EcoDrivingViolation[];
  totalPenalties: number;
  overallRank: number;
}

// ─── Wialon Types ────────────────────────────────────────────────────────────

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

export interface WialonReportResponse {
  reportResult?: {
    msgsRendered: number;
    stats: [string, string][];
    tables: WialonReportTable[];
  };
  error?: number;
}

export interface WialonReportTable {
  name: string;
  label: string;
  flags: number;
  rows: number;
  columns: number;
  header: string[];
  total: string[];
  c?: (string | number)[][];
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

// ─── Wialon Report Module Types ──────────────────────────────────────────────

export interface ReportRow {
  n: number;
  i1: number;
  i2: number;
  t1: number;
  t2: number;
  d: number;
  c: ReportCell[];
}

export type ReportCell = string | { t: string; v: number; y?: number; x?: number };

export interface ReportTableResult {
  tableName: string;
  tableIndex: number;
  header: string[];
  rowCount: number;
  rows: Record<string, string | number>[];
}

export interface UnitReportResult {
  unitId: number;
  templateId: number;
  templateName: string;
  interval: { from: number; to: number };
  tables: ReportTableResult[];
}

export interface DriverReportResult {
  driverId: string;
  templateId: number;
  templateName: string;
  interval: { from: number; to: number };
  tables: ReportTableResult[];
}

export const WIALON_RESOURCE_ID = 5738;

export const WIALON_REPORT_TEMPLATES = {
  UNIT_FUEL_CHART: 24,
  UNIT_SPEED_CHART: 8,
  DRIVER_REPORT: 6,
} as const;
