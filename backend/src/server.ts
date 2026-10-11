import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { pool } from './db/pool.js';

const app = buildApp();
const server = app.listen(env.PORT, () => {
  logger.info(`EVMS backend listening on :${env.PORT}`);
});

const shutdown = async () => {
  logger.info('shutting down');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
