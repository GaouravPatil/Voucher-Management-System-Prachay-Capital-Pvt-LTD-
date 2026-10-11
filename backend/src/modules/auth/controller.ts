import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { loginService } from './service.js';
import { pool } from '../../db/pool.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await loginService(email, password);
  res.json({ data });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, employee_code, department, signature_path FROM users WHERE id = $1',
    [req.user!.id]
  );
  const u = rows[0];
  res.json({
    data: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      employeeCode: u.employee_code,
      department: u.department,
      hasSignature: !!u.signature_path,
    },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).send();
});
