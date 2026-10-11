import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/db/pool.js';
import { env } from '../src/config/env.js';

const USERS = [
  { name: 'Diana Director', email: 'director@abc.com', password: 'Director@123', role: 'DIRECTOR', employee_code: 'D-001', department: 'Admin' },
  { name: 'Arjun Accounts', email: 'accounts@abc.com', password: 'Accounts@123', role: 'ACCOUNTS', employee_code: 'A-001', department: 'Finance' },
  { name: 'Emma Employee', email: 'emma@abc.com', password: 'Employee@123', role: 'EMPLOYEE', employee_code: 'E-1001', department: 'Engineering' },
  { name: 'Ethan Employee', email: 'ethan@abc.com', password: 'Employee@123', role: 'EMPLOYEE', employee_code: 'E-1002', department: 'Sales' },
];

async function main() {
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, env.BCRYPT_ROUNDS);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employee_code, department)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (lower(email)) DO NOTHING`,
      [u.name, u.email.toLowerCase(), hash, u.role, u.employee_code, u.department]
    );
    // ensure lowercase email unique index compat: update password if exists
    await pool.query(`UPDATE users SET password_hash=$1, name=$2 WHERE lower(email)=lower($3)`, [hash, u.name, u.email]);
  }
  console.log('seed done');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
