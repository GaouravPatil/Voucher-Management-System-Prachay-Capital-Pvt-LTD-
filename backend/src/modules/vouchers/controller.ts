import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as repo from './repository.js';
import * as svc from './service.js';
import { uploadSignature } from '../../middleware/upload.js';
import { AppError } from '../../utils/AppError.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

const scopeOf = (req: Request) => ({ role: req.user!.role, userId: req.user!.id });

export const create = asyncHandler(async (req: Request, res: Response) => {
  const v = await svc.createVoucher(req.user!, req.body);
  res.status(201).json({ data: repo.toVoucherJson(v, req.user!) });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, total, totalPages } = await repo.listVouchers(req.query as any, scopeOf(req));
  res.json({
    data: rows.map((r) => repo.toVoucherJson(r, req.user!)),
    meta: { page: Number((req.query as any).page ?? 1), limit: Number((req.query as any).limit ?? 10), total, totalPages },
  });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const v = await repo.getVoucherByIdScoped(req.params.id, scopeOf(req));
  if (!v) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
  res.json({ data: repo.toVoucherJson(v, req.user!) });
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const v = await repo.getVoucherByIdScoped(req.params.id, scopeOf(req));
  if (!v) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
  res.json({ data: await svc.getHistory(req.params.id) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const v = await svc.updateVoucher(req.user!, req.params.id, req.body);
  res.json({ data: repo.toVoucherJson(v, req.user!) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteVoucher(req.user!, req.params.id);
  res.status(204).send();
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const v = await svc.submitVoucher(req.user!, req.params.id);
  res.json({ data: repo.toVoucherJson(v, req.user!) });
});

export const employeeSignature = (req: Request, res: Response, next: any) => {
  uploadSignature(req, res, async (err: any) => {
    if (err) return next(err);
    try {
      if (!req.file) throw new AppError(422, 'VALIDATION_ERROR', 'Signature file is required');
      const v = await svc.setEmployeeSignature(req.user!, req.params.id, req.file.buffer, req.file.mimetype);
      res.json({ data: repo.toVoucherJson(v, req.user!) });
    } catch (e) {
      next(e);
    }
  });
};

export const approve = (req: Request, res: Response, next: any) => {
  uploadSignature(req, res, async (err: any) => {
    if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') return next(err);
    try {
      const useSaved = req.body?.useSavedSignature === true || req.body?.useSavedSignature === 'true';
      const remarks = req.body?.remarks ?? undefined;
      const v = await svc.approveVoucher(req.user!, req.params.id, {
        buffer: req.file?.buffer,
        mime: req.file?.mimetype,
        useSavedSignature: useSaved,
        remarks,
      });
      res.json({ data: repo.toVoucherJson(v, req.user!) });
    } catch (e) {
      next(e);
    }
  });
};

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const v = await svc.rejectVoucher(req.user!, req.params.id, req.body?.reason ?? '');
  res.json({ data: repo.toVoucherJson(v, req.user!) });
});

export const signatureImage = asyncHandler(async (req: Request, res: Response) => {
  const v = await repo.getVoucherByIdScoped(req.params.id, scopeOf(req));
  if (!v) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Voucher not found');
  const type = req.params.type as string;
  if (type !== 'employee' && type !== 'director')
    throw new AppError(404, 'VOUCHER_NOT_FOUND', 'Not found');
  const rel = type === 'employee' ? v.employee_signature_path : v.director_signature_path;
  if (!rel) throw new AppError(404, 'VOUCHER_NOT_FOUND', 'No signature');
  const buf = await fs.readFile(path.join(env.UPLOAD_DIR, rel as string));
  const ext = (rel as string).split('.').pop() ?? 'png';
  const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(buf);
});
