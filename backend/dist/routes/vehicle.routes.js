"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/qr/:qrValue", vehicle_controller_1.vehicleController.getByQr);
router.get("/", vehicle_controller_1.vehicleController.getAll);
router.get("/:id", vehicle_controller_1.vehicleController.getById);
router.post("/", (0, rbac_middleware_1.requireRole)("ADMIN"), vehicle_controller_1.vehicleController.create);
router.put("/:id", (0, rbac_middleware_1.requireRole)("ADMIN"), vehicle_controller_1.vehicleController.update);
router.delete("/:id", (0, rbac_middleware_1.requireRole)("ADMIN"), vehicle_controller_1.vehicleController.delete);
exports.default = router;
//# sourceMappingURL=vehicle.routes.js.map