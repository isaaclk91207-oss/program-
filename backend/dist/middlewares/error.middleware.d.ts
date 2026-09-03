import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";
export declare function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void;
export declare function createAppError(statusCode: number, code: string, message: string): AppError;
export declare function notFoundHandler(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map