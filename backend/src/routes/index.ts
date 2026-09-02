import { Router } from "express";
import authRoutes from "./auth.routes";
import transportRoutes from "./transport.routes";
import tripRoutes from "./trip.routes";
import driverRoutes from "./driver.routes";
import vehicleRoutes from "./vehicle.routes";
import feedbackRoutes from "./feedback.routes";
import notificationRoutes from "./notification.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/requests", transportRoutes);
router.use("/trips", tripRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
