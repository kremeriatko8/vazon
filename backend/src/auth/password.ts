import crypto from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing with Node's built-in scrypt (no extra dependency).
 * Stored format: "scrypt$<salt-hex>$<hash-hex>".
 */
const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SCHEME = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const HEX = /^[0-9a-f]+$/;

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = await scrypt(plain, salt, KEY_BYTES);
  return `${SCHEME}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/**
 * Returns true only when `plain` matches the stored hash.
 * Never throws: malformed or unexpected input returns false.
 */
export async function verifyPassword(
  plain: unknown,
  stored: unknown,
): Promise<boolean> {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;

  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [scheme, saltHex, hashHex] = parts;
  if (
    scheme !== SCHEME ||
    saltHex.length !== SALT_BYTES * 2 ||
    hashHex.length !== KEY_BYTES * 2 ||
    !HEX.test(saltHex) ||
    !HEX.test(hashHex)
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(plain, Buffer.from(saltHex, 'hex'), KEY_BYTES);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
