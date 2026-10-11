import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validate(schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      next();
    } catch (e: any) {
      const details = e?.issues?.map((i: any) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      next(new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details));
    }
  };
}
