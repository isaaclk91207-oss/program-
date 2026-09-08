import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getAll);
router.get("/unread-count", notificationController.getUnreadCount);
router.post("/", requireRole("ADMIN"), notificationController.create);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);

export default router;
