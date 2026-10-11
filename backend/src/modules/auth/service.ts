import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO7aRzQZQZQZQZQZQZQZQZQZQZQZQZQZQ.';

export async function loginService(email: string, password: string) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  const user = rows[0];
  const hash = user ? user.password_hash : DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok || !user.is_active) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
  return {
    token,
    expiresIn: env.JWT_EXPIRES_IN,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeCode: user.employee_code,
      department: user.department,
      hasSignature: !!user.signature_path,
    },
  };
}
