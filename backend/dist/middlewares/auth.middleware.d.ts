import { Response, NextFunction } from "express";
import { AuthenticatedRequest, JwtPayload } from "../types";
export declare function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
export declare function generateToken(payload: JwtPayload): string;
//# sourceMappingURL=auth.middleware.d.ts.map