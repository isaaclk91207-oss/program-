import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { adminService } from "../services/admin.service";
import { cronService } from "../services/cron.service";
import { netprosService } from "../services/netpros.service";

export class AdminController {
  async getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboard();
      res.json(stats);
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
}

export const adminController = new AdminController();
