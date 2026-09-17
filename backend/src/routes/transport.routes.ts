import { Router } from "express";
import { transportController } from "../controllers/transport.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.get("/", transportController.getAll);
router.get("/stats", requireRole("ADMIN"), transportController.getStats);
router.put("/assign-batch", requireRole("ADMIN"), transportController.assignBatch);
router.get("/:id", transportController.getById);
router.post("/", requireRole("PASSENGER"), transportController.create);
router.put("/:id/assign", requireRole("ADMIN"), transportController.assignDriver);

export default router;
