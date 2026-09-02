import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { createAppError } from "./error.middleware";

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createAppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createAppError(403, "FORBIDDEN", `Role '${req.user.role}' is not authorized for this action`)
      );
    }

    next();
  };
}
