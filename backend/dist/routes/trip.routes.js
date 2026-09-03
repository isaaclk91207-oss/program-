"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trip_controller_1 = require("../controllers/trip.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/qr-verify", trip_controller_1.tripController.verifyQR);
router.post("/checkin", (0, rbac_middleware_1.requireRole)("DRIVER"), trip_controller_1.tripController.driverCheckIn);
router.post("/checkout", (0, rbac_middleware_1.requireRole)("DRIVER"), trip_controller_1.tripController.driverCheckOut);
router.get("/driver", (0, rbac_middleware_1.requireRole)("DRIVER"), trip_controller_1.tripController.getDriverTrips);
router.get("/passenger", (0, rbac_middleware_1.requireRole)("PASSENGER"), trip_controller_1.tripController.getPassengerTrips);
router.get("/:id", trip_controller_1.tripController.getTripDetail);
router.post("/:id/qr-pickup", (0, rbac_middleware_1.requireRole)("PASSENGER"), trip_controller_1.tripController.pickupQRScan);
router.post("/:id/qr-dropoff", (0, rbac_middleware_1.requireRole)("PASSENGER"), trip_controller_1.tripController.dropoffQRScan);
exports.default = router;
//# sourceMappingURL=trip.routes.js.map