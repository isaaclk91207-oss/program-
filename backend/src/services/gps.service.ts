import { Server as SocketIOServer } from "socket.io";
import { netprosService } from "./netpros.service";
import { prisma } from "../lib/prisma";
import type { LiveVehicleLocation } from "../types";

const POLL_INTERVAL_MS = 10_000;
const STORE_INTERVAL_MS = 60_000;

export class GpsService {
  private io: SocketIOServer | null = null;
  private timer: NodeJS.Timeout | null = null;
  private storeTimer: NodeJS.Timeout | null = null;
  private latestLocations: LiveVehicleLocation[] = [];
  private lastPollTime: Date | null = null;
  private lastStoreTime: Date | null = null;
  private lastError: string | null = null;

  start(io: SocketIOServer): void {
    this.io = io;
    if (this.timer) {
      console.log("[GPS] Already running. Restarting poller...");
      clearInterval(this.timer);
    }
    if (this.storeTimer) {
      clearInterval(this.storeTimer);
    }

    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    this.storeTimer = setInterval(() => this.storePositions(), STORE_INTERVAL_MS);
    console.log(`[GPS] Live location poller started (every ${POLL_INTERVAL_MS / 1000}s)`);
    console.log(`[GPS] Position storage started (every ${STORE_INTERVAL_MS / 1000}s)`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[GPS] Poller stopped");
    }
    if (this.storeTimer) {
      clearInterval(this.storeTimer);
      this.storeTimer = null;
      console.log("[GPS] Position storage stopped");
    }
  }

  getStatus() {
    return {
      running: !!this.timer,
      pollIntervalMs: POLL_INTERVAL_MS,
      storeIntervalMs: STORE_INTERVAL_MS,
      lastPollTime: this.lastPollTime?.toISOString() || null,
      lastStoreTime: this.lastStoreTime?.toISOString() || null,
      lastError: this.lastError,
      vehiclesTracked: this.latestLocations.length,
    };
  }

  async poll(): Promise<void> {
    try {
      const locations = await netprosService.getLiveVehicleLocations();
      this.latestLocations = locations;
      this.lastPollTime = new Date();
      this.lastError = null;

      if (this.io) {
        this.io.emit("gps:update", locations);
      }
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : "Unknown GPS polling error";
      console.error("[GPS] Poll failed:", this.lastError);
    }
  }

  async storePositions(): Promise<void> {
    if (this.latestLocations.length === 0) return;

    try {
      const now = new Date();
      const positions = this.latestLocations.map((loc) => ({
        vehicleId: loc.vehicleId,
        plate: loc.plate,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: loc.speed,
        course: loc.course,
        timestamp: new Date(loc.timestamp * 1000),
      }));

      await prisma.gpsPosition.createMany({ data: positions });
      this.lastStoreTime = now;
      console.log(`[GPS] Stored ${positions.length} positions`);
    } catch (err) {
      console.error("[GPS] Failed to store positions:", err);
    }
  }
}

export const gpsService = new GpsService();
