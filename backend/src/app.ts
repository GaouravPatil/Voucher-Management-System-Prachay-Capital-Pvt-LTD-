import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimit.js';
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import vouchersRoutes from './modules/vouchers/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import metaRoutes from './modules/meta/routes.js';
import { pool } from './db/pool.js';

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(globalLimiter);

  app.use((req, _res, next) => {
    (req as any).requestId = req.headers['x-request-id'] ?? Math.random().toString(36).slice(2);
    next();
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(500).json({ status: 'error', db: 'down' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/vouchers', vouchersRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/meta', metaRoutes);

  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
