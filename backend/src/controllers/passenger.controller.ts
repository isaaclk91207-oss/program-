import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { passengerService } from "../services/passenger.service";

export class PassengerController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const passenger = await passengerService.create(req.body);
      res.status(201).json(passenger);
    } catch (err) {
      next(err);
    }
  }
}

export const passengerController = new PassengerController();
