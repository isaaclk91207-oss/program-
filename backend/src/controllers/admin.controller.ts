import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { adminService } from "../services/admin.service";
import { cronService } from "../services/cron.service";
import { netprosService } from "../services/netpros.service";
import { gpsService } from "../services/gps.service";

export class AdminController {
  async getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboard();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getLiveLocations(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const locations = await netprosService.getLiveVehicleLocations();
      res.json(locations);
    } catch (err) {
      next(err);
    }
  }

  async getSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.getSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.updateSettings(req.body);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  async exportData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const data = await adminService.exportData(type, req.query as Record<string, unknown>);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getNetprosStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = netprosService.getSyncStatus();
      const cronStatus = cronService.getStatus();
      res.json({ ...status, cron: cronStatus });
    } catch (err) {
      next(err);
    }
  }

  async triggerNetprosSync(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await cronService.triggerNow();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async triggerEcoSync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // First sync GPS device IDs from Wialon
      const gpsSync = await netprosService.syncGpsDeviceIds();

      // Then run eco-driving sync
      const { timeFrom, timeTo } = req.body as { timeFrom?: number; timeTo?: number };
      const now = Math.floor(Date.now() / 1000);
      const defaultFrom = now - 30 * 24 * 3600;
      const ecoResult = await netprosService.syncEcoDriving(timeFrom || defaultFrom, timeTo || now);

      res.json({
        ...ecoResult,
        gpsSync,
      });
    } catch (err) {
      next(err);
    }
  }

  async syncGpsDeviceIds(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await netprosService.syncGpsDeviceIds();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
