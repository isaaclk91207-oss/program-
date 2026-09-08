import { Server as SocketIOServer } from "socket.io";
import { netprosService } from "./netpros.service";
import type { LiveVehicleLocation } from "../types";

const POLL_INTERVAL_MS = 10_000;

export class GpsService {
  private io: SocketIOServer | null = null;
  private timer: NodeJS.Timeout | null = null;
  private latestLocations: LiveVehicleLocation[] = [];
  private lastPollTime: Date | null = null;
  private lastError: string | null = null;

  start(io: SocketIOServer): void {
    this.io = io;
    if (this.timer) {
      console.log("[GPS] Already running. Restarting poller...");
      clearInterval(this.timer);
    }

    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    console.log(`[GPS] Live location poller started (every ${POLL_INTERVAL_MS / 1000}s)`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[GPS] Poller stopped");
    }
  }

  getStatus() {
    return {
      running: !!this.timer,
      pollIntervalMs: POLL_INTERVAL_MS,
      lastPollTime: this.lastPollTime?.toISOString() || null,
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
}

export const gpsService = new GpsService();