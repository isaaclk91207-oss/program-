"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("../config");
const netpros_service_1 = require("./netpros.service");
let scheduledTask = null;
class CronService {
    start() {
        if (scheduledTask) {
            console.log("[Cron] Already running. Stopping previous instance...");
            scheduledTask.stop();
        }
        const schedule = config_1.config.cronSchedule;
        if (!node_cron_1.default.validate(schedule)) {
            console.error(`[Cron] Invalid schedule: ${schedule}`);
            return;
        }
        scheduledTask = node_cron_1.default.schedule(schedule, async () => {
            console.log(`[Cron] Starting Netpros sync at ${new Date().toISOString()}`);
            try {
                const result = await netpros_service_1.netprosService.syncFleet();
                if (result.status === "success") {
                    console.log(`[Cron] Sync completed: ${result.unitsFound} units, ${result.tripsFound} trips`);
                }
                else {
                    console.error(`[Cron] Sync failed: ${result.error}`);
                }
            }
            catch (err) {
                console.error("[Cron] Sync error:", err);
            }
        });
        console.log(`[Cron] Scheduled Netpros sync with pattern: ${schedule}`);
    }
    stop() {
        if (scheduledTask) {
            scheduledTask.stop();
            scheduledTask = null;
            console.log("[Cron] Stopped");
        }
    }
    getStatus() {
        return {
            running: !!scheduledTask,
            schedule: config_1.config.cronSchedule,
        };
    }
    async triggerNow() {
        console.log("[Cron] Manual sync triggered");
        const result = await netpros_service_1.netprosService.syncFleet();
        return result;
    }
}
exports.CronService = CronService;
exports.cronService = new CronService();
//# sourceMappingURL=cron.service.js.map