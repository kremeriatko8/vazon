import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ImageType } from './image-type.js';

/** URL path under which saved photos are served (see configureApp). */
export const UPLOADS_URL_PREFIX = '/api/v1/uploads/';

/** Only names created by `save` are accepted, so a key can never escape the folder. */
const KEY_PATTERN = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

/** Absolute path of the uploads folder from UPLOADS_DIR (relative paths start at the backend folder). */
export function resolveUploadsDir(value: string | undefined): string {
  const dir = value && value.trim().length > 0 ? value : 'uploads';
  return isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
}

/**
 * Stores plant photos on the local disk. All file access goes through this
 * class, so it can later be replaced by cloud storage without touching the
 * plants code.
 */
@Injectable()
export class PhotoStorageService {
  private readonly logger = new Logger(PhotoStorageService.name);
  readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = resolveUploadsDir(config.get<string>('UPLOADS_DIR'));
  }

  /** Saves the file under a new random name and returns that name (the key). */
  async save(buffer: Buffer, type: ImageType): Promise<string> {
    const key = `${randomBytes(16).toString('hex')}.${type}`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, key), buffer, { flag: 'wx' });
    return key;
  }

  /**
   * Deletes a saved file. Never throws: a leftover file is better than a
   * failed request, and it is logged for cleanup.
   */
  async remove(key: string): Promise<void> {
    if (!KEY_PATTERN.test(key)) {
      this.logger.warn(`Refusing to delete unexpected photo key "${key}"`);
      return;
    }
    try {
      await rm(join(this.dir, key), { force: true });
    } catch (error) {
      this.logger.warn(`Could not delete photo ${key}: ${String(error)}`);
    }
  }
}

/** Path the browser loads the photo from, or null when there is no photo. */
/**
 * Public URL of a stored photo. Absolute when PUBLIC_API_URL is set, because the
 * frontend is served from another origin and would resolve a relative path
 * against itself; relative otherwise.
 */
export function photoUrlFor(key: string | null): string | null {
  if (!key) return null;
  const origin = (process.env.PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
  return `${origin}${UPLOADS_URL_PREFIX}${key}`;
}
