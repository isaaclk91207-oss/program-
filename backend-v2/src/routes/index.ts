import { Router } from "express";
import transportRoutes from "./transport.routes";
import tripRoutes from "./trip.routes";
import driverRoutes from "./driver.routes";
import vehicleRoutes from "./vehicle.routes";
import adminRoutes from "./admin.routes";
import reportRoutes from "./reports.routes";

const router = Router();

router.use("/transport-requests", transportRoutes);
router.use("/trips", tripRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/admin", adminRoutes);
router.use("/reports", reportRoutes);

export default router;
