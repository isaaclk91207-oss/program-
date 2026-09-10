import { Router } from "express";
import { driverController } from "../controllers/driver.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.get("/cert-summary", requireRole("ADMIN"), driverController.getCertSummary);
router.get("/assessments", requireRole("ADMIN"), driverController.getAllAssessments);
router.get("/passengers", requireRole("ADMIN"), driverController.getPassengers);
router.get("/hours", requireRole("ADMIN", "DRIVER"), driverController.getDrivingHours);
router.get("/", requireRole("ADMIN"), driverController.getAll);
router.get("/:id", driverController.getById);
router.post("/", requireRole("ADMIN"), driverController.create);
router.put("/:id", requireRole("ADMIN"), driverController.update);
router.put("/:id/assessment", requireRole("ADMIN"), driverController.updateAssessment);
router.get("/:id/feedback", driverController.getFeedback);
router.delete("/:id", requireRole("ADMIN"), driverController.delete);

export default router;
