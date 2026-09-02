import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { vehicleService } from "../services/vehicle.service";

export class VehicleController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const vehicles = await vehicleService.getAll({
        status: status as string,
        search: search as string,
      });
      res.json(vehicles);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.getById(req.params.id);
      res.json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.create(req.body);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.update(req.params.id, req.body);
      res.json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async getByQr(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.findByQrValue(req.params.qrValue);
      if (!vehicle) {
        return res.status(404).json({ error: { code: "QR_NOT_FOUND", message: "QR code not registered" } });
      }
      res.json(vehicle);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await vehicleService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const vehicleController = new VehicleController();
