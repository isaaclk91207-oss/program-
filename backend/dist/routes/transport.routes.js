"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transport_controller_1 = require("../controllers/transport.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", transport_controller_1.transportController.getAll);
router.get("/stats", (0, rbac_middleware_1.requireRole)("ADMIN"), transport_controller_1.transportController.getStats);
router.get("/:id", transport_controller_1.transportController.getById);
router.post("/", (0, rbac_middleware_1.requireRole)("PASSENGER"), transport_controller_1.transportController.create);
router.put("/:id/assign", (0, rbac_middleware_1.requireRole)("ADMIN"), transport_controller_1.transportController.assignDriver);
exports.default = router;
//# sourceMappingURL=transport.routes.js.map