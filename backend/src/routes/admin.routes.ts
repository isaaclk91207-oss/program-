import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/dashboard", adminController.getDashboard);
router.get("/gps/live", adminController.getLiveLocations);
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);
router.get("/export/:type", adminController.exportData);
router.get("/netpros/status", adminController.getNetprosStatus);
router.post("/netpros/sync", adminController.triggerNetprosSync);

export default router;
