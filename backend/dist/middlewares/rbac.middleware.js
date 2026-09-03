"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const error_middleware_1 = require("./error.middleware");
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next((0, error_middleware_1.createAppError)(401, "UNAUTHORIZED", "Authentication required"));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next((0, error_middleware_1.createAppError)(403, "FORBIDDEN", `Role '${req.user.role}' is not authorized for this action`));
        }
        next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map