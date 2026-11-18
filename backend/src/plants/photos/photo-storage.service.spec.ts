import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import {
  PhotoStorageService,
  photoUrlFor,
  resolveUploadsDir,
} from './photo-storage.service.js';

describe('PhotoStorageService (real files in a temporary folder)', () => {
  let dir: string;
  let storage: PhotoStorageService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'vazon-photos-'));
    const config = {
      get: () => join(dir, 'uploads'),
    } as unknown as ConfigService;
    storage = new PhotoStorageService(config);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('save creates the folder and writes the file under a random key', async () => {
    const key = await storage.save(Buffer.from('image'), 'png');
    expect(key).toMatch(/^[0-9a-f]{32}\.png$/);
    expect(readFileSync(join(storage.dir, key), 'utf8')).toBe('image');

    const other = await storage.save(Buffer.from('image'), 'png');
    expect(other).not.toBe(key);
  });

  it('remove deletes a saved file and ignores a missing one', async () => {
    const key = await storage.save(Buffer.from('image'), 'jpg');
    await storage.remove(key);
    expect(existsSync(join(storage.dir, key))).toBe(false);
    await expect(storage.remove(key)).resolves.toBeUndefined();
  });

  it('remove refuses keys it did not create, such as path traversal', async () => {
    const outside = join(dir, 'secret.txt');
    writeFileSync(outside, 'keep me');
    await storage.remove('../secret.txt');
    expect(existsSync(outside)).toBe(true);
  });
});

describe('photo helpers', () => {
  it('photoUrlFor builds the public path, or null', () => {
    expect(photoUrlFor('abc.png')).toBe('/api/v1/uploads/abc.png');
    expect(photoUrlFor(null)).toBeNull();
  });

  it('resolveUploadsDir defaults to "uploads" in the working folder', () => {
    expect(resolveUploadsDir(undefined)).toBe(
      resolve(process.cwd(), 'uploads'),
    );
    expect(resolveUploadsDir('  ')).toBe(resolve(process.cwd(), 'uploads'));
    expect(resolveUploadsDir('/var/vazon/photos')).toBe('/var/vazon/photos');
  });
});
