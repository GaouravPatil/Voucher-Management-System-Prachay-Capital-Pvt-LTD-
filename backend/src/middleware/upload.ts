import multer from 'multer';
import { env } from '../config/env.js';

export const uploadSignature = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
}).single('signature');
