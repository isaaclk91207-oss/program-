"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("../services/admin.service");
const cron_service_1 = require("../services/cron.service");
const netpros_service_1 = require("../services/netpros.service");
class AdminController {
    async getDashboard(_req, res, next) {
        try {
            const stats = await admin_service_1.adminService.getDashboard();
            res.json(stats);
        }
        catch (err) {
            next(err);
        }
    }
    async getSettings(_req, res, next) {
        try {
            const settings = await admin_service_1.adminService.getSettings();
            res.json(settings);
        }
        catch (err) {
            next(err);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const settings = await admin_service_1.adminService.updateSettings(req.body);
            res.json(settings);
        }
        catch (err) {
            next(err);
        }
    }
    async exportData(req, res, next) {
        try {
            const { type } = req.params;
            const data = await admin_service_1.adminService.exportData(type, req.query);
            res.json(data);
        }
        catch (err) {
            next(err);
        }
    }
    async getNetprosStatus(_req, res, next) {
        try {
            const status = netpros_service_1.netprosService.getSyncStatus();
            const cronStatus = cron_service_1.cronService.getStatus();
            res.json({ ...status, cron: cronStatus });
        }
        catch (err) {
            next(err);
        }
    }
    async triggerNetprosSync(_req, res, next) {
        try {
            const result = await cron_service_1.cronService.triggerNow();
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=admin.controller.js.map