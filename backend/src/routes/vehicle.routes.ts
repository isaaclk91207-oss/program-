import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.get("/qr/:qrValue", vehicleController.getByQr);
router.get("/", vehicleController.getAll);
router.get("/:id", vehicleController.getById);
router.post("/", requireRole("ADMIN"), vehicleController.create);
router.put("/:id", requireRole("ADMIN"), vehicleController.update);
router.delete("/:id", requireRole("ADMIN"), vehicleController.delete);

export default router;
