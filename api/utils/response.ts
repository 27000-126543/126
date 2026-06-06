import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../../shared/types.js';

export function successResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  res.status(statusCode).json(response);
}

export function errorResponse(res: Response, error: string, statusCode: number = 400): void {
  const response: ApiResponse = {
    success: false,
    error
  };
  res.status(statusCode).json(response);
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
