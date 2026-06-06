import type { Request, Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

interface LoginRequest {
  username: string;
  password: string;
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    errorResponse(res, '用户名和密码不能为空', 400);
    return;
  }

  const user = db.authenticate(username, password);
  if (!user) {
    errorResponse(res, '用户名或密码错误', 401);
    return;
  }

  const token = `${user.id}:${Date.now()}`;

  successResponse(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  }, '登录成功');
}
