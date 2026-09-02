import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred";

  console.error(`[ERROR] ${code}: ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

export function createAppError(statusCode: number, code: string, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = createAppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
  next(error);
}
