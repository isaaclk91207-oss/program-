import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { transportService } from "../services/transport.service";

export class TransportController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await transportService.getAll(
        {
          status: status as string,
          search: search as string,
          role: req.user?.role,
          userId: req.user?.id,
        },
        Number(page) || 1,
        Number(limit) || 50
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const request = await transportService.getById(req.params.id);
      res.json(request);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transportService.create({
        ...req.body,
        passengerId: req.user?.id,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async assignDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await transportService.assignDriver(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async assignBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { requestIds, driverId, vehicleId } = req.body;
      const result = await transportService.assignBatch(requestIds, { driverId, vehicleId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await transportService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}

export const transportController = new TransportController();
