import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { tripService } from "../services/trip.service";

export class TripController {
  async verifyQR(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.verifyQR(req.body, req.user.id, req.user.role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async pickupQRScan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.pickupQRScan(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async dropoffQRScan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.dropoffQRScan(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async driverCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.driverCheckIn(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async driverCheckOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.driverCheckOut(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getDriverTrips(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const { status } = req.query;
      const trips = await tripService.getDriverTrips(req.user.id, status as string);
      res.json(trips);
    } catch (err) {
      next(err);
    }
  }

  async getPassengerTrips(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const { status } = req.query;
      const trips = await tripService.getPassengerTrips(req.user.id, status as string);
      res.json(trips);
    } catch (err) {
      next(err);
    }
  }

  async getTripDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const trip = await tripService.getTripDetail(req.params.id);
      res.json(trip);
    } catch (err) {
      next(err);
    }
  }

  async adminCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await tripService.adminCheckIn(req.body.driverId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async adminCheckOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await tripService.adminCheckOut(req.body.driverId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async startWaiting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.startWaiting(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async stopWaiting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await tripService.stopWaiting(req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const tripController = new TripController();
