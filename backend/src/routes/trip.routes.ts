import { Router } from "express";
import { tripController } from "../controllers/trip.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.post("/qr-verify", tripController.verifyQR);
router.post("/checkin", requireRole("DRIVER"), tripController.driverCheckIn);
router.post("/checkout", requireRole("DRIVER"), tripController.driverCheckOut);
router.post("/admin/checkin", requireRole("ADMIN"), tripController.adminCheckIn);
router.post("/admin/checkout", requireRole("ADMIN"), tripController.adminCheckOut);
router.get("/driver", requireRole("DRIVER"), tripController.getDriverTrips);
router.get("/passenger", requireRole("PASSENGER"), tripController.getPassengerTrips);
router.get("/:id", tripController.getTripDetail);
router.post("/:id/qr-pickup", requireRole("PASSENGER"), tripController.pickupQRScan);
router.post("/:id/qr-dropoff", requireRole("PASSENGER"), tripController.dropoffQRScan);
router.post("/:id/waiting/start", requireRole("DRIVER", "ADMIN"), tripController.startWaiting);
router.post("/:id/waiting/stop", requireRole("DRIVER", "ADMIN"), tripController.stopWaiting);

export default router;
