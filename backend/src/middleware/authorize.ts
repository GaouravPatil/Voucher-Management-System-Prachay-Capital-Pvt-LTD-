import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHENTICATED', 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'FORBIDDEN', 'Forbidden'));
    next();
  };
}
