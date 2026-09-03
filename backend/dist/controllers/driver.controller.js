"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverController = exports.DriverController = void 0;
const driver_service_1 = require("../services/driver.service");
class DriverController {
    async getAll(req, res, next) {
        try {
            const { status, search, certStatus } = req.query;
            const drivers = await driver_service_1.driverService.getAll({
                status: status,
                search: search,
                certStatus: certStatus,
            });
            res.json(drivers);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const driver = await driver_service_1.driverService.getById(req.params.id);
            res.json(driver);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const driver = await driver_service_1.driverService.create(req.body);
            res.status(201).json(driver);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const driver = await driver_service_1.driverService.update(req.params.id, req.body);
            res.json(driver);
        }
        catch (err) {
            next(err);
        }
    }
    async updateAssessment(req, res, next) {
        try {
            const assessment = await driver_service_1.driverService.updateAssessment(req.params.id, req.body);
            res.json(assessment);
        }
        catch (err) {
            next(err);
        }
    }
    async getFeedback(req, res, next) {
        try {
            const feedback = await driver_service_1.driverService.getFeedback(req.params.id);
            res.json(feedback);
        }
        catch (err) {
            next(err);
        }
    }
    async getCertSummary(_req, res, next) {
        try {
            const summary = await driver_service_1.driverService.getCertificationSummary();
            res.json(summary);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await driver_service_1.driverService.delete(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
    async getAllAssessments(req, res, next) {
        try {
            const { driverId, certLevel } = req.query;
            const assessments = await driver_service_1.driverService.getAllAssessments({
                driverId: driverId,
                certLevel: certLevel,
            });
            res.json(assessments);
        }
        catch (err) {
            next(err);
        }
    }
    async getPassengers(req, res, next) {
        try {
            const { search } = req.query;
            const passengers = await driver_service_1.driverService.getPassengers({ search: search });
            res.json(passengers);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DriverController = DriverController;
exports.driverController = new DriverController();
//# sourceMappingURL=driver.controller.js.map