import { Router, Request, Response } from "express";
import { wialonReports } from "../services/wialon-reports";
import { WIALON_REPORT_TEMPLATES, WIALON_RESOURCE_ID } from "../types";
import { config } from "../config";

const router = Router();

// GET /api/v1/reports/unit/:unitId — Fetch unit report
// Query params: templateId (24=Fuel, 8=Speed), timeFrom, timeTo, sid (optional — auto-login if omitted)
router.get("/unit/:unitId", async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const { templateId, timeFrom, timeTo, sid } = req.query;

    if (!unitId) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "unitId is required" } });
      return;
    }

    const numericUnitId = parseInt(unitId, 10);
    if (isNaN(numericUnitId)) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "unitId must be a number" } });
      return;
    }

    const numericTemplateId = parseInt(String(templateId || WIALON_REPORT_TEMPLATES.UNIT_FUEL_CHART), 10);
    const numericFrom = parseInt(String(timeFrom || Math.floor(Date.now() / 1000) - 86400), 10);
    const numericTo = parseInt(String(timeTo || Math.floor(Date.now() / 1000)), 10);

    let sessionSid = String(sid || "");
    if (!sessionSid) {
      console.log(`[Reports] Auto-login for unit report (unitId=${numericUnitId}, template=${numericTemplateId})`);
      sessionSid = await wialonReports.loginWialon(config.wialonToken);
      console.log(`[Reports] Auto-login OK, sid=${sessionSid.substring(0, 8)}...`);
    }

    const result = await wialonReports.executeUnitReport(
      sessionSid,
      numericUnitId,
      numericTemplateId,
      numericFrom,
      numericTo
    );

    res.json(result);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    console.error(`[Reports] Unit report failed:`, error.message);
    console.error(`[Reports] Params:`, {
      unitId: req.params.unitId,
      templateId: req.query.templateId,
      timeFrom: req.query.timeFrom,
      timeTo: req.query.timeTo,
      resourceId: WIALON_RESOURCE_ID,
    });
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || "REPORT_FAILED",
        message: error.message || "Failed to fetch unit report",
      },
    });
  }
});

// GET /api/v1/reports/driver/:driverId — Fetch driver report
// Query params: timeFrom, timeTo, sid (optional — auto-login if omitted)
router.get("/driver/:driverId", async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { timeFrom, timeTo, sid } = req.query;

    if (!driverId) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "driverId is required" } });
      return;
    }

    const numericFrom = parseInt(String(timeFrom || Math.floor(Date.now() / 1000) - 86400), 10);
    const numericTo = parseInt(String(timeTo || Math.floor(Date.now() / 1000)), 10);

    const driverResourceId = config.wialonDriverReportResourceId || WIALON_RESOURCE_ID;

    let sessionSid = String(sid || "");
    if (!sessionSid) {
      console.log(`[Reports] Auto-login for driver report (driverId=${driverId})`);
      sessionSid = await wialonReports.loginWialon(config.wialonToken);
      console.log(`[Reports] Auto-login OK, sid=${sessionSid.substring(0, 8)}...`);
    }

    console.log(`[Reports] Executing driver report: driverId=${driverId}, from=${numericFrom}, to=${numericTo}`);

    const result = await wialonReports.executeDriverReport(
      sessionSid,
      driverId,
      numericFrom,
      numericTo,
      driverResourceId
    );

    res.json(result);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    console.error(`[Reports] Driver report failed:`, error.message);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || "REPORT_FAILED",
        message: error.message || "Failed to fetch driver report",
      },
    });
  }
});

// GET /api/v1/reports/templates — List available report templates
router.get("/templates", (_req: Request, res: Response) => {
  res.json({
    resourceId: wialonReports.WIALON_RESOURCE_ID,
    templates: [
      {
        id: WIALON_REPORT_TEMPLATES.UNIT_FUEL_CHART,
        name: "Unit Fuel Chart",
        type: "unit",
        description: "Fuel consumption and fillings report for a vehicle unit",
      },
      {
        id: WIALON_REPORT_TEMPLATES.UNIT_SPEED_CHART,
        name: "Unit Speed Chart",
        type: "unit",
        description: "Speed data and speeding violations for a vehicle unit",
      },
      {
        id: WIALON_REPORT_TEMPLATES.DRIVER_REPORT,
        name: "Driver Report",
        type: "driver",
        description: "Driver activity, assignments, and eco driving summary",
      },
    ],
  });
});

// GET /api/v1/reports/resources — Discover all Wialon resources and their report templates
router.get("/resources", async (_req: Request, res: Response) => {
  try {
    const sid = await wialonReports.loginWialon(config.wialonToken);
    const resources = await wialonReports.getReportResources(sid);
    res.json(resources);
  } catch (err: unknown) {
    const error = err as { statusCode?: number; code?: string; message?: string };
    console.error(`[Reports] Resource discovery failed:`, error.message);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || "DISCOVERY_FAILED",
        message: error.message || "Failed to discover resources",
      },
    });
  }
});

export default router;
