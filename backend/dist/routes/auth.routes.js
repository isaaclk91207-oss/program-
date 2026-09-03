"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.authController.login);
router.post("/register", auth_controller_1.authController.register);
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.authController.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map