"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", (0, rbac_middleware_1.requireRole)("ADMIN"), feedback_controller_1.feedbackController.getAll);
router.get("/driver/:driverId", feedback_controller_1.feedbackController.getByDriver);
router.get("/driver/:driverId/stats", feedback_controller_1.feedbackController.getDriverStats);
router.post("/:id", (0, rbac_middleware_1.requireRole)("PASSENGER"), feedback_controller_1.feedbackController.submit);
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map