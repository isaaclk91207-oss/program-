"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, rbac_middleware_1.requireRole)("ADMIN"));
router.get("/dashboard", admin_controller_1.adminController.getDashboard);
router.get("/settings", admin_controller_1.adminController.getSettings);
router.put("/settings", admin_controller_1.adminController.updateSettings);
router.get("/export/:type", admin_controller_1.adminController.exportData);
router.get("/netpros/status", admin_controller_1.adminController.getNetprosStatus);
router.post("/netpros/sync", admin_controller_1.adminController.triggerNetprosSync);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map