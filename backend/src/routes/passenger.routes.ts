import { Router } from "express";
import { passengerController } from "../controllers/passenger.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN"), passengerController.create);

export default router;
