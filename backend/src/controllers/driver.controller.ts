import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { driverService } from "../services/driver.service";

export class DriverController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, certStatus } = req.query;
      const drivers = await driverService.getAll({
        status: status as string,
        search: search as string,
        certStatus: certStatus as string,
      });
      res.json(drivers);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.getById(req.params.id);
      res.json(driver);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.create(req.body);
      res.status(201).json(driver);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.update(req.params.id, req.body);
      res.json(driver);
    } catch (err) {
      next(err);
    }
  }

  async updateAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const assessment = await driverService.updateAssessment(req.params.id, req.body);
      res.json(assessment);
    } catch (err) {
      next(err);
    }
  }

  async getFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const feedback = await driverService.getFeedback(req.params.id);
      res.json(feedback);
    } catch (err) {
      next(err);
    }
  }

  async getCertSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await driverService.getCertificationSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await driverService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getAllAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { driverId, certLevel } = req.query;
      const assessments = await driverService.getAllAssessments({
        driverId: driverId as string,
        certLevel: certLevel as string,
      });
      res.json(assessments);
    } catch (err) {
      next(err);
    }
  }

  async getPassengers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const passengers = await driverService.getPassengers({ search: search as string });
      res.json(passengers);
    } catch (err) {
      next(err);
    }
  }

  async getDrivingHours(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const hours = await driverService.getDrivingHours((req.query.driverId as string) || undefined);
      res.json(hours);
    } catch (err) {
      next(err);
    }
  }

  async getTripHours(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const hours = await driverService.getDrivingHours(req.params.id);
      res.json(hours.length > 0 ? hours[0].trips : []);
    } catch (err) {
      next(err);
    }
  }

  async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await driverService.createTask(req.params.id, req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tasks = await driverService.getTasks(req.params.id);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await driverService.updateTask(req.params.id, req.params.taskId, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await driverService.deleteTask(req.params.id, req.params.taskId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const driverController = new DriverController();
