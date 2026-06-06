import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('API Error:', err);
  errorResponse(res, err.message || '服务器内部错误', 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  errorResponse(res, `未找到 ${req.method} ${req.path}`, 404);
}
