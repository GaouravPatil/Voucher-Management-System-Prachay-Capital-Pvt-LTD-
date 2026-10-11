import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { detectImageType } from './fileType.js';
import { AppError } from './AppError.js';
import { logger } from './logger.js';

export interface StoredFile {
  relativePath: string;
  mime: string;
  ext: string;
}

export function signaturesDir(): string {
  return path.join(env.UPLOAD_DIR, 'signatures');
}

export async function saveSignature(buffer: Buffer, claimedMime: string): Promise<StoredFile> {
  const detected = detectImageType(buffer);
  if (!detected) throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only PNG, JPEG, WEBP images are allowed');
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (buffer.length > maxBytes) throw new AppError(413, 'FILE_TOO_LARGE', `File exceeds ${env.MAX_UPLOAD_MB} MB`);
  const dir = signaturesDir();
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${detected.ext}`;
  await fs.writeFile(path.join(dir, name), buffer);
  return { relativePath: `signatures/${name}`, mime: detected.mime, ext: detected.ext };
}

export async function deleteStoredFile(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  try {
    await fs.unlink(path.join(env.UPLOAD_DIR, relativePath));
  } catch (e) {
    logger.warn({ relativePath }, 'failed to delete orphaned file');
  }
}
