import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  // Multer errors
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File too large' } });
  }
  // Postgres errors
  if (err?.code === '23505') {
    return res.status(409).json({ error: { code: 'VALIDATION_ERROR', message: 'Duplicate value' } });
  }
  if (err?.code === '23514') {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Constraint violated' } });
  }
  logger.error({ err }, 'unhandled error');
  const body: any = { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
  if (env.NODE_ENV !== 'production') body.error.details = String(err?.message ?? err);
  return res.status(500).json(body);
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'VOUCHER_NOT_FOUND', message: 'Not found' } });
}
