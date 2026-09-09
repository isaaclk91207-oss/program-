import { prisma } from "../lib/prisma";
import { config } from "../config";
import { createAppError } from "../middlewares/error.middleware";
import { WialonLoginResponse, WialonUnit, WialonUnitPos, WialonTrip, LiveVehicleLocation } from "../types";

let sessionToken: string | null = null;
let lastSyncTime: Date | null = null;
let syncStatus: "idle" | "syncing" | "error" = "idle";
let lastError: string | null = null;

const ACTIVE_TRIP_STATUSES = ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS"];

export class NetprosService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.wialonBaseUrl;
  }

  async login(username?: string, password?: string): Promise<string> {
    const token = username ?? config.wialonToken;
    const eid = await this.fetchToken(token, password || "");

    if (!eid) {
      throw createAppError(500, "WIALON_AUTH_FAILED", "Failed to authenticate with Wialon");
    }

    sessionToken = eid;
    return eid;
  }

  private async fetchToken(username: string, password: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/wialon/ajax.html?svc=token/login&params={"token":"${username}"}`;
      const response = await fetch(url);
      const data = await response.json() as WialonLoginResponse;

      if (data.error) {
        console.error(`[Wialon] Login error: code ${data.error}`);
        return null;
      }

      return data.eid || null;
    } catch (err) {
      console.error("[Wialon] Login request failed:", err);
      return null;
    }
  }

  async searchItems(query?: string): Promise<WialonUnit[]> {
    if (!sessionToken) {
      await this.login();
    }

    try {
      const params = {
        spec: { itemsType: "avl_unit", propName: "sys_name", propValueMask: query || "*", sortType: "sys_name" },
        force: 1,
        flags: 1,
        from: 0,
        to: 100,
      };

      const url = `${this.baseUrl}/wialon/ajax.html?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sessionToken}`;
      const response = await fetch(url);
      const data = (await response.json()) as { error?: number; items?: WialonUnit[] };

      if (data.error) {
        const errorMsg = this.mapWialonError(data.error);
        throw createAppError(502, "WIALON_API_ERROR", errorMsg);
      }

      return data.items || [];
    } catch (err) {
      if (err instanceof Error && "code" in err) throw err;
      console.error("[Wialon] search_items failed:", err);
      throw createAppError(502, "WIALON_REQUEST_FAILED", "Failed to fetch units from Wialon");
    }
  }

  /**
   * Fetches live positions for all tracked vehicles from Wialon.
   * Uses core/search_items with flags=1025 (base + last-message position).
   * Retries once with a fresh login if the session expired (error 1).
   */
  async getLiveVehicleLocations(): Promise<LiveVehicleLocation[]> {
    if (!sessionToken) {
      await this.login();
    }

    const exec = async () => {
      const params = {
        spec: { itemsType: "avl_unit", propName: "sys_name", propValueMask: "*", sortType: "sys_name" },
        force: 1,
        flags: 0x401,
        from: 0,
        to: 1000,
      };
      const url = `${this.baseUrl}/wialon/ajax.html?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sessionToken}`;
      const response = await fetch(url);
      const data = (await response.json()) as { error?: number; items?: WialonUnitPos[] };
      if (data.error) {
        const errorMsg = this.mapWialonError(data.error);
        throw createAppError(502, "WIALON_API_ERROR", errorMsg);
      }
      return data.items || [];
    };

    let units: WialonUnitPos[];
    try {
      units = await exec();
    } catch (err) {
      // Session expired (Wialon error 1) or invalid — retry once with fresh login
      if (err instanceof Error && "code" in err && (err as { code?: string }).code === "WIALON_API_ERROR") {
        sessionToken = null;
        await this.login();
        units = await exec();
      } else {
        throw err;
      }
    }

    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, plate: true, gpsDeviceId: true },
    });

    // Vehicles currently on an active trip
    const activeTripVehicles = new Set(
      (
        await prisma.transportRequest.findMany({
          where: { status: { in: ACTIVE_TRIP_STATUSES } },
          select: { vehicleId: true },
        })
      ).map((r) => r.vehicleId)
    );

    const locations: LiveVehicleLocation[] = [];

    for (const vehicle of vehicles) {
      if (!vehicle.gpsDeviceId) continue;

      let unit = units.find((u) => u.id === vehicle.gpsDeviceId);
      if (!unit) {
        unit = units.find((u) => u.nm === vehicle.plate);
      }

      if (!unit || !unit.pos) continue;

      locations.push({
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        gpsDeviceId: vehicle.gpsDeviceId,
        latitude: unit.pos.y,
        longitude: unit.pos.x,
        speed: unit.pos.s,
        course: unit.pos.c,
        timestamp: unit.pos.t,
        onActiveTrip: activeTripVehicles.has(vehicle.id),
      });
    }

    return locations;
  }

  async getUnitTrips(unitId: number, timeFrom: number, timeTo: number): Promise<WialonTrip[]> {
    if (!sessionToken) {
      await this.login();
    }

    try {
      const params = {
        itemId: unitId,
        timeFrom,
        timeTo,
        flags: 0,
      };

      const url = `${this.baseUrl}/wialon/ajax.html?svc=unit/get_trips&params=${encodeURIComponent(JSON.stringify(params))}&sid=${sessionToken}`;
      const response = await fetch(url);
      const data = (await response.json()) as { error?: number; trips?: WialonTrip[] };

      if (data.error) {
        const errorMsg = this.mapWialonError(data.error);
        throw createAppError(502, "WIALON_API_ERROR", errorMsg);
      }

      return data.trips || [];
    } catch (err) {
      if (err instanceof Error && "code" in err) throw err;
      console.error("[Wialon] get_trips failed:", err);
      throw createAppError(502, "WIALON_REQUEST_FAILED", "Failed to fetch trips from Wialon");
    }
  }

  async syncFleet(): Promise<{
    status: "success" | "error";
    unitsFound: number;
    tripsFound: number;
    timestamp: string;
    error?: string;
  }> {
    syncStatus = "syncing";
    lastError = null;

    try {
      const units = await this.searchItems();
      let totalTrips = 0;

      const now = Math.floor(Date.now() / 1000);
      const sixHoursAgo = now - 6 * 60 * 60;

      for (const unit of units) {
        try {
          const trips = await this.getUnitTrips(unit.id, sixHoursAgo, now);
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

  getSyncStatus() {
    return {
      status: syncStatus,
      lastSyncTime: lastSyncTime?.toISOString() || null,
      lastError,
      sessionActive: !!sessionToken,
    };
  }

  private mapWialonError(errorCode: number): string {
    const errorMap: Record<number, string> = {
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
      11: "Password reset error",
      14: "Billing error",
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

    return errorMap[errorCode] || `Wialon error code: ${errorCode}`;
  }
}

export const netprosService = new NetprosService();
