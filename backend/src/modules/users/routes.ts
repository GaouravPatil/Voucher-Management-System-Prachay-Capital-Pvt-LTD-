import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { uploadSignature } from '../../middleware/upload.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import { saveSignature, deleteStoredFile } from '../../utils/fileStorage.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

const r = Router();
r.use(authenticate, authorize('EMPLOYEE', 'DIRECTOR'));

r.put('/me/signature', (req: Request, res: Response, next) => {
  uploadSignature(req, res, async (err: any) => {
    if (err) return next(err);
    try {
      if (!req.file) throw new AppError(422, 'VALIDATION_ERROR', 'Signature file is required');
      const stored = await saveSignature(req.file.buffer, req.file.mimetype);
      const { rows } = await pool.query('SELECT signature_path FROM users WHERE id=$1', [req.user!.id]);
      const old = rows[0]?.signature_path as string | null;
      await pool.query('UPDATE users SET signature_path=$1 WHERE id=$2', [stored.relativePath, req.user!.id]);
      await deleteStoredFile(old ?? undefined);
      res.json({ data: { present: true, url: '/api/users/me/signature/image' } });
    } catch (e) {
      next(e);
    }
  });
});

r.get('/me/signature', asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await pool.query('SELECT signature_path FROM users WHERE id=$1', [req.user!.id]);
  const p = rows[0]?.signature_path;
  res.json({ data: { present: !!p, url: p ? '/api/users/me/signature/image' : null } });
}));

r.get('/me/signature/image', asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await pool.query('SELECT signature_path FROM users WHERE id=$1', [req.user!.id]);
  const p = rows[0]?.signature_path as string | null;
  if (!p) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'No signature');
  const abs = path.join(env.UPLOAD_DIR, p);
  const buf = await fs.readFile(abs);
  const ext = p.split('.').pop() ?? 'png';
  const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(buf);
}));

r.delete('/me/signature', asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await pool.query('SELECT signature_path FROM users WHERE id=$1', [req.user!.id]);
  await pool.query('UPDATE users SET signature_path=NULL WHERE id=$1', [req.user!.id]);
  await deleteStoredFile(rows[0]?.signature_path);
  res.json({ data: { present: false } });
}));

export default r;
