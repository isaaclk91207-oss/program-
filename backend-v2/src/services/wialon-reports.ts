import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import {
  ReportRow,
  ReportCell,
  ReportTableResult,
  UnitReportResult,
  DriverReportResult,
  WIALON_RESOURCE_ID,
  WIALON_REPORT_TEMPLATES,
} from "../types";

const prisma = new PrismaClient();

// ─── Error Map ───────────────────────────────────────────────────────────────

const WIALON_ERROR_MAP: Record<number, string> = {
  0: "Success",
  1: "Invalid session",
  2: "Invalid service name",
  3: "Invalid result",
  4: "Invalid input",
  5: "Error performing request",
  6: "Unknown error",
  7: "Access denied",
  8: "Invalid user name or password",
  9: "Authorization server unavailable",
  10: "Reached limit of concurrent requests",
  1001: "No messages for the given interval",
  1003: "Only one request at a time is allowed",
  1005: "Execution timeout",
  1011: "Your IP has changed or session has expired",
};

function mapWialonError(code: number): string {
  return WIALON_ERROR_MAP[code] || `Wialon error code: ${code}`;
}

// ─── Axios-style Error ───────────────────────────────────────────────────────

interface WialonApiError {
  statusCode: number;
  code: string;
  message: string;
}

function createError(statusCode: number, code: string, message: string): WialonApiError {
  return { statusCode, code, message };
}

// ─── Fetch Helper ────────────────────────────────────────────────────────────

async function wialonFetch(svc: string, params: Record<string, unknown>, sid: string): Promise<Record<string, unknown>> {
  const url = `${config.wialonBaseUrl}/wialon/ajax.html`;
  const fullParams = { svc, params: JSON.stringify(params), sid };

  const queryString = Object.entries(fullParams)
    .map(([key, val]) => `${key}=${encodeURIComponent(String(val))}`)
    .join("&");

  const response = await fetch(`${url}?${queryString}`);

  if (!response.ok) {
    throw createError(502, "WIALON_HTTP_ERROR", `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.error !== undefined && data.error !== 0) {
    const errorCode = data.error as number;
    throw createError(502, "WIALON_API_ERROR", mapWialonError(errorCode));
  }

  return data;
}

// ─── Step 0: Cleanup Previous Report ─────────────────────────────────────────

async function cleanupReport(sid: string): Promise<void> {
  try {
    await wialonFetch("report/cleanup_result", {}, sid);
  } catch {
    // Ignore — may be no previous result
  }
}

// ─── Step 1: Execute Report ──────────────────────────────────────────────────

interface ExecReportResponse {
  reportResult?: {
    msgsRendered: number;
    stats: [string, string][];
    tables: {
      name: string;
      label: string;
      f: number;
      rows: number;
      columns: number;
      header: string[];
      total: string[];
      header_type?: string[];
    }[];
  };
}

async function execReport(
  sid: string,
  reportObjectId: number,
  templateId: number,
  timeFrom: number,
  timeTo: number,
  reportResourceId: number = WIALON_RESOURCE_ID
): Promise<{
  msgsRendered: number;
  stats: [string, string][];
  tables: {
    name: string;
    label: string;
    f: number;
    rows: number;
    columns: number;
    header: string[];
    total: string[];
  }[];
}> {
  // Cleanup first
  await cleanupReport(sid);

  const params: Record<string, unknown> = {
    reportResourceId,
    reportTemplateId: templateId,
    reportObjectId,
    reportObjectSecId: 0,
    interval: {
      from: timeFrom,
      to: timeTo,
      flags: 0,
    },
  };

  const data = (await wialonFetch("report/exec_report", params, sid)) as ExecReportResponse;

  if (!data.reportResult) {
    throw createError(502, "NO_REPORT_RESULT", "Report execution returned no result");
  }

  return data.reportResult;
}

// ─── Step 2: Get Result Rows ─────────────────────────────────────────────────

async function getResultRows(
  sid: string,
  tableIndex: number,
  indexFrom: number,
  indexTo: number
): Promise<ReportRow[]> {
  const params = {
    tableIndex,
    indexFrom,
    indexTo,
  };

  const data = (await wialonFetch("report/get_result_rows", params, sid)) as unknown as ReportRow[];
  return Array.isArray(data) ? data : [];
}

// ─── Cell Parser ─────────────────────────────────────────────────────────────

function parseCell(cell: ReportCell): string | number {
  if (typeof cell === "string") return cell;
  if (typeof cell === "number") return cell;
  if (typeof cell === "object" && cell !== null) {
    // Cell object: { t: "text", v: numericValue, y: lat, x: lon }
    if (cell.t !== undefined) return cell.t;
    if (cell.v !== undefined) return cell.v;
  }
  return String(cell);
}

function extractCellMeta(cell: ReportCell): Record<string, unknown> | undefined {
  if (typeof cell === "object" && cell !== null && !Array.isArray(cell)) {
    const meta: Record<string, unknown> = {};
    if ("y" in cell) meta.lat = cell.y;
    if ("x" in cell) meta.lon = cell.x;
    if ("v" in cell) meta.numericValue = cell.v;
    return Object.keys(meta).length > 0 ? meta : undefined;
  }
  return undefined;
}

// ─── Row Parser ──────────────────────────────────────────────────────────────

function parseRow(row: ReportRow, header: string[]): Record<string, string | number> {
  const record: Record<string, string | number> = {};

  // Add row metadata
  record["_rowIndex"] = row.n;
  record["_messageRange"] = `${row.i1}-${row.i2}`;
    record["_timeRange"] = `${row.t1}-${row.t2}`;
  record["_childCount"] = row.d;

  for (let i = 0; i < header.length && i < row.c.length; i++) {
    const colName = header[i] || `col_${i}`;
    const value = parseCell(row.c[i]);
    record[colName] = value;

    // Extract coordinates from location cells
    const meta = extractCellMeta(row.c[i]);
    if (meta) {
      if (meta.lat !== undefined) record[`${colName}_lat`] = meta.lat as number;
      if (meta.lon !== undefined) record[`${colName}_lon`] = meta.lon as number;
    }
  }

  return record;
}

// ─── Fetch All Rows for a Table ──────────────────────────────────────────────

async function fetchAllRows(
  sid: string,
  tableIndex: number,
  totalRows: number,
  header: string[],
  batchSize = 100
): Promise<Record<string, string | number>[]> {
  const allRows: Record<string, string | number>[] = [];
  let from = 0;

  while (from < totalRows) {
    const to = Math.min(from + batchSize, totalRows);
    const rows = await getResultRows(sid, tableIndex, from, to);

    for (const row of rows) {
      // Include all rows — parent rows contain the trip/event summary
      allRows.push(parseRow(row, header));
    }

    from = to;
  }

  return allRows;
}

// ─── Public: Execute Unit Report ─────────────────────────────────────────────

export async function executeUnitReport(
  sid: string,
  unitId: number,
  templateId: number,
  timeFrom: number,
  timeTo: number
): Promise<UnitReportResult> {
  const templateNames: Record<number, string> = {
    [WIALON_REPORT_TEMPLATES.UNIT_FUEL_CHART]: "Unit Fuel Chart",
    [WIALON_REPORT_TEMPLATES.UNIT_SPEED_CHART]: "Unit Speed Chart",
  };

  // Step 1: Execute report
  const reportResult = await execReport(sid, unitId, templateId, timeFrom, timeTo);

  // Step 2: Fetch rows for each table
  const tables: ReportTableResult[] = [];

  for (let i = 0; i < reportResult.tables.length; i++) {
    const tableMeta = reportResult.tables[i];
    const rows = await fetchAllRows(sid, i, tableMeta.rows, tableMeta.header);

    tables.push({
      tableName: tableMeta.label || tableMeta.name,
      tableIndex: i,
      header: tableMeta.header,
      rowCount: rows.length,
      rows,
    });
  }

  return {
    unitId,
    templateId,
    templateName: templateNames[templateId] || `Template ${templateId}`,
    interval: { from: timeFrom, to: timeTo },
    tables,
  };
}

// ─── Public: Execute Driver Report (DB-based) ────────────────────────────────

export async function executeDriverReport(
  _sid: string,
  driverId: string,
  timeFrom: number,
  timeTo: number,
  _reportResourceId: number = WIALON_RESOURCE_ID
): Promise<DriverReportResult> {
  const templateId = WIALON_REPORT_TEMPLATES.DRIVER_REPORT;

  const fromDate = new Date(timeFrom * 1000);
  const toDate = new Date(timeTo * 1000);

  // Look up driver
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      trips: {
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: { vehicle: true, request: true },
        orderBy: { createdAt: "desc" },
      },
      ecoDrivingRecords: {
        where: {
          date: { gte: fromDate, lte: toDate },
        },
        orderBy: { date: "desc" },
      },
      drivingHours: {
        where: {
          date: { gte: fromDate, lte: toDate },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!driver) {
    throw createError(404, "DRIVER_NOT_FOUND", `Driver ${driverId} not found`);
  }

  const tables: ReportTableResult[] = [];

  // ── Table 1: Driver Summary ──
  const completedTrips = driver.trips.filter((t) => t.status === "COMPLETED");
  const totalDurationSec = driver.drivingHours.reduce((sum, h) => sum + h.durationSeconds, 0);
  const totalDurationHrs = Math.round((totalDurationSec / 3600) * 10) / 10;
  const totalPenalties = driver.ecoDrivingRecords.reduce((sum, r) => sum + r.penaltyPoints, 0);
  const avgRank = driver.ecoDrivingRecords.length > 0
    ? Math.round((driver.ecoDrivingRecords.reduce((sum, r) => sum + r.rank, 0) / driver.ecoDrivingRecords.length) * 10) / 10
    : 0;

  tables.push({
    tableName: "Driver Summary",
    tableIndex: 0,
    header: ["Field", "Value"],
    rowCount: 8,
    rows: [
      { Field: "Driver Name", Value: driver.name },
      { Field: "Employee ID", Value: driver.employeeId },
      { Field: "Status", Value: driver.status },
      { Field: "Total Trips", Value: driver.trips.length },
      { Field: "Completed Trips", Value: completedTrips.length },
      { Field: "Driving Hours", Value: totalDurationHrs },
      { Field: "Eco Score", Value: driver.ecoScore ?? "N/A" },
      { Field: "Total Penalties", Value: totalPenalties },
    ],
  });

  // ── Table 2: Trip History ──
  const tripRows = driver.trips.map((trip) => ({
    "Trip ID": trip.id.substring(0, 8),
    Date: trip.createdAt.toISOString().split("T")[0],
    Vehicle: trip.vehicle.plateNumber,
    Status: trip.status,
    "Pickup": trip.request?.pickupLocation ?? "-",
    Destination: trip.request?.destination ?? "-",
    "Start Time": trip.startTime ? trip.startTime.toISOString().replace("T", " ").substring(0, 19) : "-",
    "End Time": trip.endTime ? trip.endTime.toISOString().replace("T", " ").substring(0, 19) : "-",
  }));

  tables.push({
    tableName: "Trip History",
    tableIndex: 1,
    header: ["Trip ID", "Date", "Vehicle", "Status", "Pickup", "Destination", "Start Time", "End Time"],
    rowCount: tripRows.length,
    rows: tripRows,
  });

  // ── Table 3: Eco Driving Violations ──
  const ecoRows = driver.ecoDrivingRecords.map((record) => ({
    Date: record.date.toISOString().split("T")[0],
    "Violation Type": record.violationType,
    "Penalty Points": record.penaltyPoints,
    Rank: record.rank,
    Duration: record.duration ?? "-",
    Mileage: record.mileage ?? "-",
    "Avg Speed": record.avgSpeed ?? "-",
  }));

  tables.push({
    tableName: "Eco Driving Violations",
    tableIndex: 2,
    header: ["Date", "Violation Type", "Penalty Points", "Rank", "Duration", "Mileage", "Avg Speed"],
    rowCount: ecoRows.length,
    rows: ecoRows,
  });

  return {
    driverId,
    templateId,
    templateName: "Driver Report (DB)",
    interval: { from: timeFrom, to: timeTo },
    tables,
  };
}

// ─── Login Helper ────────────────────────────────────────────────────────────

interface WialonLoginResponse {
  eid: string;
  user?: { nm: string };
  error?: number;
}

export async function loginWialon(token: string): Promise<string> {
  const url = `${config.wialonBaseUrl}/wialon/ajax.html`;
  const params = JSON.stringify({ token });
  const queryString = `svc=token/login&params=${encodeURIComponent(params)}`;

  const response = await fetch(`${url}?${queryString}`);
  if (!response.ok) {
    throw createError(502, "WIALON_HTTP_ERROR", `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as WialonLoginResponse;

  if (data.error !== undefined && data.error !== 0) {
    throw createError(502, "WIALON_LOGIN_FAILED", mapWialonError(data.error));
  }

  if (!data.eid) {
    throw createError(502, "WIALON_LOGIN_FAILED", "No session ID returned");
  }

  return data.eid;
}

// ─── Units Helper ────────────────────────────────────────────────────────────

interface WialonUnitListItem {
  nm: string;
  id: number;
  cls: number;
  maker?: string;
  model?: string;
  hwType?: string;
}

export async function getAvailableUnits(sid: string): Promise<WialonUnitListItem[]> {
  const params = {
    query: "",
    flags: 1,
  };

  const data = (await wialonFetch("core/search_items", params, sid)) as unknown as WialonUnitListItem[];
  return Array.isArray(data) ? data : [];
}

// ─── Resource Discovery ─────────────────────────────────────────────────────

interface WialonResourceItem {
  id: number;
  nm: string;
  cls: number;
}

interface WialonReportTemplate {
  id: number;
  n: string;
}

export async function getReportResources(sid: string): Promise<{
  resourceId: number;
  resourceName: string;
  reports: { id: number; name: string }[];
}[]> {
  // Step 1: Search for all resources (avl_resource class = 2048)
  const resourceData = (await wialonFetch("core/search_items", {
    spec: { itemsType: "avl_resource", propName: "*", propValueMask: "*", sortType: "sys_name" },
    force: 1,
    flags: 1,
    from: 0,
    to: 100,
  }, sid)) as unknown as WialonResourceItem[];

  const resources = Array.isArray(resourceData) ? resourceData : [];
  const results: { resourceId: number; resourceName: string; reports: { id: number; name: string }[] }[] = [];

  // Step 2: For each resource, try to list its report templates
  for (const resource of resources) {
    try {
      const reportList = (await wialonFetch("report/get_report_list", {
        resourceId: resource.id,
      }, sid)) as unknown as WialonReportTemplate[];

      const reports = Array.isArray(reportList)
        ? reportList.map((r) => ({ id: r.id, name: r.n }))
        : [];

      results.push({
        resourceId: resource.id,
        resourceName: resource.nm,
        reports,
      });
    } catch {
      // Resource may not have reports or access denied — skip
    }
  }

  return results;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const wialonReports = {
  executeUnitReport,
  executeDriverReport,
  loginWialon,
  getAvailableUnits,
  getReportResources,
  WIALON_RESOURCE_ID,
  WIALON_REPORT_TEMPLATES,
};

// ─── Exported Helpers (for testing) ──────────────────────────────────────────

export { mapWialonError, createError, parseCell, extractCellMeta, parseRow };
