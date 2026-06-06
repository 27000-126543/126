import type { Request, Response, NextFunction } from 'express';
import { db } from '../data/database.js';
import { errorResponse } from '../utils/response.js';
import type { UserRole } from '../../shared/types.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    errorResponse(res, '未提供认证令牌', 401);
    return;
  }

  const token = authHeader.substring(7);
  const [userId] = token.split(':');
  
  const user = db.getById('users', userId);
  if (!user) {
    errorResponse(res, '无效的认证令牌', 401);
    return;
  }

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, '未认证', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      errorResponse(res, '权限不足', 403);
      return;
    }
    next();
  };
}
