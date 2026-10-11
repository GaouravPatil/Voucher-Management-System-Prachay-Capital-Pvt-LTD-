import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

export interface AuthUser {
  id: string;
  role: 'EMPLOYEE' | 'DIRECTOR' | 'ACCOUNTS';
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHENTICATED', 'Missing token');
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: AuthUser['role'] };
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user || !user.is_active) throw new AppError(401, 'UNAUTHENTICATED', 'Session expired');
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (e: any) {
    if (e instanceof AppError) return next(e);
    return next(new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}
