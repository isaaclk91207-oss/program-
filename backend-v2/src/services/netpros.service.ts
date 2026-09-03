import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import {
  WialonLoginResponse,
  WialonUnit,
  WialonTrip,
  WialonReportResponse,
  EcoDrivingViolation,
  EcoDrivingReportResult,
} from "../types";

const prisma = new PrismaClient();

let sessionToken: string | null = null;
let lastSyncTime: Date | null = null;
let syncStatus: "idle" | "syncing" | "error" = "idle";
let lastError: string | null = null;

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
  1002: "Item with such unique property already exists",
  1003: "Only one request at a time is allowed",
  1004: "Limit of messages has been exceeded",
  1005: "Execution timeout",
  1006: "Exceeding the limit of attempts to re-request",
  1011: "Your IP has changed or session has expired",
  2014: "Selected user is a creator for some other objects",
  2015: "Sensor deleting is forbidden",
};

function mapWialonError(code: number): string {
  return WIALON_ERROR_MAP[code] || `Wialon error code: ${code}`;
}

function createAppError(statusCode: number, code: string, message: string): Error & { statusCode: number; code: string } {
  const err = new Error(message) as Error & { statusCode: number; code: string };
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

// ─── Session Management ──────────────────────────────────────────────────────

async function ensureSession(): Promise<string> {
  if (!sessionToken) {
    await login();
  }
  return sessionToken!;
}

async function login(username?: string, password?: string): Promise<string> {
  const token = username
    ? await fetchToken(username, password || "")
    : config.wialonToken;

  if (!token) {
    throw createAppError(500, "WIALON_AUTH_FAILED", "Failed to authenticate with Wialon");
  }

  sessionToken = token;
  return token;
}

async function fetchToken(username: string, password: string): Promise<string | null> {
  try {
    const url = `${config.wialonBaseUrl}/wialon/ajax.html?svc=token/login&params={"token":"${username}"}`;
    const response = await fetch(url);
    const data = (await response.json()) as WialonLoginResponse;

    if (data.error) {
      console.error(`[Wialon] Login error: code ${data.error} - ${mapWialonError(data.error)}`);
      return null;
    }

    return data.eid || null;
  } catch (err) {
    console.error("[Wialon] Login request failed:", err);
    return null;
  }
}

// ─── Wialon API Helpers ──────────────────────────────────────────────────────

async function wialonRequest(svc: string, params: Record<string, unknown>): Promise<unknown> {
  const sid = await ensureSession();
  const url = `${config.wialonBaseUrl}/wialon/ajax.html?svc=${svc}&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sid}`;
  const response = await fetch(url);
  const data: Record<string, unknown> = await response.json() as Record<string, unknown>;

  if (data.error && data.error !== 0) {
    // Session expired — retry once with fresh login
    if (data.error === 1) {
      sessionToken = null;
      const newSid = await ensureSession();
      const retryUrl = `${config.wialonBaseUrl}/wialon/ajax.html?svc=${svc}&params=${encodeURIComponent(JSON.stringify(params))}&sid=${newSid}`;
      const retryResponse = await fetch(retryUrl);
      const retryData: Record<string, unknown> = await retryResponse.json() as Record<string, unknown>;

      if (retryData.error && retryData.error !== 0) {
        throw createAppError(502, "WIALON_API_ERROR", mapWialonError(retryData.error as number));
      }
      return retryData;
    }
    throw createAppError(502, "WIALON_API_ERROR", mapWialonError(data.error as number));
  }

  return data;
}

// ─── Trip Sync ───────────────────────────────────────────────────────────────

async function searchItems(query?: string): Promise<WialonUnit[]> {
  const data = (await wialonRequest("core/search_items", {
    spec: { itemsType: "avl_unit", propName: "sys_name", propValueMask: query || "*", sortType: "sys_name" },
    force: 1,
    flags: 1,
    from: 0,
    to: 100,
  })) as { items?: WialonUnit[] };

  return data.items || [];
}

async function getUnitTrips(unitId: number, timeFrom: number, timeTo: number): Promise<WialonTrip[]> {
  const data = (await wialonRequest("unit/get_trips", {
    itemId: unitId,
    timeFrom,
    timeTo,
    flags: 0,
  })) as { trips?: WialonTrip[] };

  return data.trips || [];
}

async function syncFleet(): Promise<{
  status: "success" | "error";
  unitsFound: number;
  tripsFound: number;
  timestamp: string;
  error?: string;
}> {
  syncStatus = "syncing";
  lastError = null;

  try {
    const units = await searchItems();
    let totalTrips = 0;

    const now = Math.floor(Date.now() / 1000);
    const sixHoursAgo = now - 6 * 60 * 60;

    for (const unit of units) {
      try {
        const trips = await getUnitTrips(unit.id, sixHoursAgo, now);
        totalTrips += trips.length;
      } catch {
        console.warn(`[Wialon] Failed to fetch trips for unit ${unit.nm} (${unit.id})`);
      }
    }

    lastSyncTime = new Date();
    syncStatus = "idle";

    return {
      status: "success",
      unitsFound: units.length,
      tripsFound: totalTrips,
      timestamp: lastSyncTime.toISOString(),
    };
  } catch (err) {
    syncStatus = "error";
    lastError = err instanceof Error ? err.message : "Unknown error";
    lastSyncTime = new Date();

    return {
      status: "error",
      unitsFound: 0,
      tripsFound: 0,
      timestamp: lastSyncTime.toISOString(),
      error: lastError,
    };
  }
}

// ─── Eco Driving Report ──────────────────────────────────────────────────────

async function cleanupReport(): Promise<void> {
  try {
    await wialonRequest("report/cleanup_result", {});
  } catch {
    // Ignore cleanup errors — may be no previous result
  }
}

async function execEcoDrivingReport(unitId: number, timeFrom: number, timeTo: number): Promise<WialonReportResponse> {
  // Step 1: Cleanup previous report result
  await cleanupReport();

  // Step 2: Execute Eco Driving report
  const params: Record<string, unknown> = {
    reportObjectId: unitId,
    reportObjectSecId: 0,
    interval: {
      from: timeFrom,
      to: timeTo,
      flags: 0,
    },
  };

  // Use configured resource/template IDs, or pass inline template
  if (config.wialonEcoReportResourceId && config.wialonEcoReportTemplateId) {
    params.reportResourceId = config.wialonEcoReportResourceId;
    params.reportTemplateId = config.wialonEcoReportTemplateId;
  } else {
    // Inline Eco Driving report template
    params.reportResourceId = 0;
    params.reportTemplateId = 0;
    params.reportTemplate = {
      n: "Eco Driving Report",
      ct: "avl_unit",
      tbl: [
        {
          n: "table_ev",
          l: "Eco driving",
          f: 0x10, // Total row
        },
      ],
    };
  }

  const data = (await wialonRequest("report/exec_report", params)) as WialonReportResponse;
  return data;
}

function parseEcoDrivingTable(report: WialonReportResponse, unitId: number, unitName: string, timeFrom: number, timeTo: number): EcoDrivingReportResult {
  const violations: EcoDrivingViolation[] = [];

  if (!report.reportResult?.tables) {
    return {
      unitId,
      unitName,
      interval: { from: timeFrom, to: timeTo },
      violations: [],
      totalPenalties: 0,
      overallRank: 10,
    };
  }

  // Find the eco driving table
  const ecoTable = report.reportResult.tables.find(
    (t) => t.name === "table_ev" || t.label?.toLowerCase().includes("eco")
  );

  if (!ecoTable || !ecoTable.c) {
    return {
      unitId,
      unitName,
      interval: { from: timeFrom, to: timeTo },
      violations: [],
      totalPenalties: 0,
      overallRank: 10,
    };
  }

  // Parse table rows
  // Columns: Violation, Value, Duration, Mileage, Avg. speed, Penalties, Rank, ...
  for (const row of ecoTable.c) {
    // Skip total/summary rows (they contain aggregate data)
    const violationType = String(row[0]).trim();
    if (!violationType || violationType === "Total" || violationType === "-" || violationType === "") {
      continue;
    }

    const violation: EcoDrivingViolation = {
      violationType,
      value: parseFloat(String(row[1])) || 0,
      duration: parseFloat(String(row[2])) || 0,
      mileage: parseFloat(String(row[3])) || 0,
      avgSpeed: parseFloat(String(row[4])) || 0,
      penalties: parseFloat(String(row[5])) || 0,
      rank: parseFloat(String(row[6])) || 10,
    };

    violations.push(violation);
  }

  // Calculate totals from the Total row if available
  let totalPenalties = 0;
  let overallRank = 10;

  if (ecoTable.total && ecoTable.total.length > 0) {
    // Total row format varies — try to extract penalties and rank
    for (let i = ecoTable.total.length - 1; i >= 0; i--) {
      const val = parseFloat(String(ecoTable.total[i]));
      if (!isNaN(val) && val > 0 && val <= 10) {
        overallRank = val;
        break;
      }
    }
    // Penalties are typically the second-to-last or third-to-last column
    for (let i = ecoTable.total.length - 2; i >= 0; i--) {
      const val = parseFloat(String(ecoTable.total[i]));
      if (!isNaN(val) && val > 0) {
        totalPenalties = val;
        break;
      }
    }
  }

  // Fallback: sum from violations
  if (totalPenalties === 0) {
    totalPenalties = violations.reduce((sum, v) => sum + v.penalties, 0);
  }

  return {
    unitId,
    unitName,
    interval: { from: timeFrom, to: timeTo },
    violations,
    totalPenalties,
    overallRank,
  };
}

async function fetchEcoDrivingScore(
  unitId: string,
  timeFrom: number,
  timeTo: number
): Promise<EcoDrivingReportResult> {
  const numericUnitId = parseInt(unitId, 10);

  try {
    const report = await execEcoDrivingReport(numericUnitId, timeFrom, timeTo);
    const unitName = `Unit-${unitId}`;
    return parseEcoDrivingTable(report, numericUnitId, unitName, timeFrom, timeTo);
  } catch (err) {
    if (err instanceof Error && "code" in err) throw err;
    console.error(`[Netpros] Eco driving report failed for unit ${unitId}:`, err);
    throw createAppError(502, "ECO_REPORT_FAILED", `Failed to fetch Eco Driving report for unit ${unitId}`);
  }
}

async function syncHeadOfficeEcoScores(timeFrom: number, timeTo: number): Promise<{
  status: "success" | "error";
  vehiclesProcessed: number;
  totalViolations: number;
  avgPenalties: number;
  timestamp: string;
  error?: string;
}> {
  syncStatus = "syncing";
  lastError = null;

  try {
    // Fetch all Head Office vehicles (9S prefix)
    const vehicles = await prisma.vehicle.findMany({
      where: { plateNumber: { startsWith: "9S" }, isHeadOffice: true },
      include: { trips: { include: { driver: true } } },
    });

    let totalViolations = 0;
    let totalPenalties = 0;
    let vehiclesProcessed = 0;

    for (const vehicle of vehicles) {
      try {
        const result = await fetchEcoDrivingScore(vehicle.netprosUnitId, timeFrom, timeTo);

        // Find the driver assigned to this vehicle (from active trip or latest trip)
        const activeTrip = vehicle.trips.find((t) => t.status === "IN_PROGRESS" || t.status === "PENDING");
        const driverId = activeTrip?.driverId || vehicle.trips[0]?.driverId;

        if (!driverId) {
          console.warn(`[Netpros] No driver found for vehicle ${vehicle.plateNumber}, skipping eco sync`);
          continue;
        }

        // Upsert each violation into EcoDrivingRecord
        const reportDate = new Date(timeFrom * 1000);

        for (const violation of result.violations) {
          await prisma.ecoDrivingRecord.upsert({
            where: {
              vehicleId_violationType_date: {
                vehicleId: vehicle.id,
                violationType: violation.violationType,
                date: reportDate,
              },
            },
            update: {
              penaltyPoints: violation.penalties,
              rank: violation.rank,
              violationValue: violation.value,
              duration: violation.duration,
              mileage: violation.mileage,
              avgSpeed: violation.avgSpeed,
              syncDate: new Date(),
            },
            create: {
              driverId,
              vehicleId: vehicle.id,
              netprosUnitId: vehicle.netprosUnitId,
              violationType: violation.violationType,
              violationValue: violation.value,
              penaltyPoints: violation.penalties,
              rank: violation.rank,
              duration: violation.duration,
              mileage: violation.mileage,
              avgSpeed: violation.avgSpeed,
              date: reportDate,
            },
          });
        }

        // Update driver's eco score summary
        const allRecords = await prisma.ecoDrivingRecord.findMany({
          where: { driverId },
        });

        const avgRank = allRecords.length > 0
          ? allRecords.reduce((sum, r) => sum + r.rank, 0) / allRecords.length
          : 10;

        const totalDriverPenalties = allRecords.reduce((sum, r) => sum + r.penaltyPoints, 0);

        await prisma.driver.update({
          where: { id: driverId },
          data: {
            ecoScore: Math.round(avgRank * 100) / 100,
            ecoPenalties: totalDriverPenalties,
            lastEcoSync: new Date(),
          },
        });

        totalViolations += result.violations.length;
        totalPenalties += result.totalPenalties;
        vehiclesProcessed++;
      } catch (err) {
        console.warn(`[Netpros] Failed to sync eco driving for vehicle ${vehicle.plateNumber}:`, err);
      }
    }

    lastSyncTime = new Date();
    syncStatus = "idle";

    return {
      status: "success",
      vehiclesProcessed,
      totalViolations,
      avgPenalties: vehiclesProcessed > 0 ? Math.round((totalPenalties / vehiclesProcessed) * 100) / 100 : 0,
      timestamp: lastSyncTime.toISOString(),
    };
  } catch (err) {
    syncStatus = "error";
    lastError = err instanceof Error ? err.message : "Unknown error";
    lastSyncTime = new Date();

    return {
      status: "error",
      vehiclesProcessed: 0,
      totalViolations: 0,
      avgPenalties: 0,
      timestamp: lastSyncTime.toISOString(),
      error: lastError,
    };
  }
}

// ─── Head Office Trip Sync (DrivingHourRecord) ──────────────────────────────

async function syncHeadOfficeTrips(timeFrom: number, timeTo: number): Promise<{
  status: "success" | "error";
  vehiclesProcessed: number;
  recordsUpserted: number;
  timestamp: string;
  error?: string;
}> {
  syncStatus = "syncing";
  lastError = null;

  try {
    // Fetch all Head Office vehicles (9S prefix)
    const vehicles = await prisma.vehicle.findMany({
      where: { plateNumber: { startsWith: "9S" }, isHeadOffice: true },
      include: { trips: { include: { driver: true } } },
    });

    let totalRecords = 0;
    let vehiclesProcessed = 0;

    for (const vehicle of vehicles) {
      try {
        const trips = await getUnitTrips(parseInt(vehicle.netprosUnitId, 10), timeFrom, timeTo);

        // Find the driver assigned to this vehicle
        const activeTrip = vehicle.trips.find((t) => t.status === "IN_PROGRESS" || t.status === "PENDING");
        const driverId = activeTrip?.driverId || vehicle.trips[0]?.driverId;

        if (!driverId) {
          console.warn(`[Netpros] No driver found for vehicle ${vehicle.plateNumber}, skipping trip sync`);
          continue;
        }

        // Upsert each trip as a DrivingHourRecord
        for (const wialonTrip of trips) {
          const tripDate = new Date(wialonTrip.t1 * 1000);
          const durationSeconds = wialonTrip.dur;

          // Find existing trip record for this vehicle+date to avoid duplicates
          const existing = await prisma.drivingHourRecord.findFirst({
            where: {
              vehicleId: vehicle.id,
              driverId,
              date: tripDate,
            },
          });

          if (existing) {
            // Update duration if changed
            if (existing.durationSeconds !== durationSeconds) {
              await prisma.drivingHourRecord.update({
                where: { id: existing.id },
                data: { durationSeconds },
              });
            }
          } else {
            await prisma.drivingHourRecord.create({
              data: {
                driverId,
                vehicleId: vehicle.id,
                netprosUnitId: vehicle.netprosUnitId,
                durationSeconds,
                date: tripDate,
              },
            });
          }
          totalRecords++;
        }

        vehiclesProcessed++;
      } catch (err) {
        console.warn(`[Netpros] Failed to sync trips for vehicle ${vehicle.plateNumber}:`, err);
      }
    }

    lastSyncTime = new Date();
    syncStatus = "idle";

    return {
      status: "success",
      vehiclesProcessed,
      recordsUpserted: totalRecords,
      timestamp: lastSyncTime.toISOString(),
    };
  } catch (err) {
    syncStatus = "error";
    lastError = err instanceof Error ? err.message : "Unknown error";
    lastSyncTime = new Date();

    return {
      status: "error",
      vehiclesProcessed: 0,
      recordsUpserted: 0,
      timestamp: lastSyncTime.toISOString(),
      error: lastError,
    };
  }
}

// ─── Status ──────────────────────────────────────────────────────────────────

function getSyncStatus() {
  return {
    status: syncStatus,
    lastSyncTime: lastSyncTime?.toISOString() || null,
    lastError,
    sessionActive: !!sessionToken,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const netprosService = {
  login,
  searchItems,
  getUnitTrips,
  syncFleet,
  syncHeadOfficeTrips,
  fetchEcoDrivingScore,
  syncHeadOfficeEcoScores,
  getSyncStatus,
};
