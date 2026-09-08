"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpsService = exports.GpsService = void 0;
const netpros_service_1 = require("./netpros.service");
const POLL_INTERVAL_MS = 10000;
class GpsService {
    constructor() {
        this.io = null;
        this.timer = null;
        this.latestLocations = [];
        this.lastPollTime = null;
        this.lastError = null;
    }
    start(io) {
        this.io = io;
        if (this.timer) {
            console.log("[GPS] Already running. Restarting poller...");
            clearInterval(this.timer);
        }
        this.poll();
        this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
        console.log(`[GPS] Live location poller started (every ${POLL_INTERVAL_MS / 1000}s)`);
    }
    stop() {
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
    async poll() {
        try {
            const locations = await netpros_service_1.netprosService.getLiveVehicleLocations();
            this.latestLocations = locations;
            this.lastPollTime = new Date();
            this.lastError = null;
            if (this.io) {
                this.io.emit("gps:update", locations);
            }
        }
        catch (err) {
            this.lastError = err instanceof Error ? err.message : "Unknown GPS polling error";
            console.error("[GPS] Poll failed:", this.lastError);
        }
    }
}
exports.GpsService = GpsService;
exports.gpsService = new GpsService();
//# sourceMappingURL=gps.service.js.map