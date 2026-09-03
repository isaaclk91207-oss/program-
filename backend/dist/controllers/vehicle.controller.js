"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleController = exports.VehicleController = void 0;
const vehicle_service_1 = require("../services/vehicle.service");
class VehicleController {
    async getAll(req, res, next) {
        try {
            const { status, search } = req.query;
            const vehicles = await vehicle_service_1.vehicleService.getAll({
                status: status,
                search: search,
            });
            res.json(vehicles);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const vehicle = await vehicle_service_1.vehicleService.getById(req.params.id);
            res.json(vehicle);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const vehicle = await vehicle_service_1.vehicleService.create(req.body);
            res.status(201).json(vehicle);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const vehicle = await vehicle_service_1.vehicleService.update(req.params.id, req.body);
            res.json(vehicle);
        }
        catch (err) {
            next(err);
        }
    }
    async getByQr(req, res, next) {
        try {
            const vehicle = await vehicle_service_1.vehicleService.findByQrValue(req.params.qrValue);
            if (!vehicle) {
                return res.status(404).json({ error: { code: "QR_NOT_FOUND", message: "QR code not registered" } });
            }
            res.json(vehicle);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await vehicle_service_1.vehicleService.delete(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VehicleController = VehicleController;
exports.vehicleController = new VehicleController();
//# sourceMappingURL=vehicle.controller.js.map