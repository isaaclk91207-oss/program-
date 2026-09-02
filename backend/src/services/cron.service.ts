import cron from "node-cron";
import { config } from "../config";
import { netprosService } from "./netpros.service";

let scheduledTask: cron.ScheduledTask | null = null;

export class CronService {
  start(): void {
    if (scheduledTask) {
      console.log("[Cron] Already running. Stopping previous instance...");
      scheduledTask.stop();
    }

    const schedule = config.cronSchedule;

    if (!cron.validate(schedule)) {
      console.error(`[Cron] Invalid schedule: ${schedule}`);
      return;
    }

    scheduledTask = cron.schedule(schedule, async () => {
      console.log(`[Cron] Starting Netpros sync at ${new Date().toISOString()}`);
      try {
        const result = await netprosService.syncFleet();
        if (result.status === "success") {
          console.log(
            `[Cron] Sync completed: ${result.unitsFound} units, ${result.tripsFound} trips`
          );
        } else {
          console.error(`[Cron] Sync failed: ${result.error}`);
        }
      } catch (err) {
        console.error("[Cron] Sync error:", err);
      }
    });

    console.log(`[Cron] Scheduled Netpros sync with pattern: ${schedule}`);
  }

  stop(): void {
    if (scheduledTask) {
      scheduledTask.stop();
      scheduledTask = null;
      console.log("[Cron] Stopped");
    }
  }

  getStatus() {
    return {
      running: !!scheduledTask,
      schedule: config.cronSchedule,
    };
  }

  async triggerNow() {
    console.log("[Cron] Manual sync triggered");
    const result = await netprosService.syncFleet();
    return result;
  }
}

export const cronService = new CronService();
