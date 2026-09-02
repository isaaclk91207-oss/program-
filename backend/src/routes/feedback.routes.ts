import { Router } from "express";
import { feedbackController } from "../controllers/feedback.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireRole("ADMIN"), feedbackController.getAll);
router.get("/driver/:driverId", feedbackController.getByDriver);
router.get("/driver/:driverId/stats", feedbackController.getDriverStats);
router.post("/:id", requireRole("PASSENGER"), feedbackController.submit);

export default router;
