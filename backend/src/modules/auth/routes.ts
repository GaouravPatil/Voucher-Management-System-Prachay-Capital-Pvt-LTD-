import { Router } from 'express';
import { login, me, logout } from './controller.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './schema.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter } from '../../middleware/rateLimit.js';

const r = Router();
r.post('/login', loginLimiter, validate({ body: loginSchema }), login);
r.get('/me', authenticate, me);
r.post('/logout', authenticate, logout);
export default r;
