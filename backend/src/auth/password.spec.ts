import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';

describe('hashPassword / verifyPassword', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produces "scrypt$<32 hex salt>$<128 hex hash>" and never contains the plain password', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(stored).not.toContain('correct horse');
  });

  it('uses a random salt, so the same password hashes differently', async () => {
    expect(await hashPassword('same-password')).not.toBe(
      await hashPassword('same-password'),
    );
  });

  it('round trip: verifies the correct password', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('wrong horse', stored)).toBe(false);
  });

  it.each([
    ['empty string', ''],
    ['no separators', 'garbage'],
    ['wrong scheme', `bcrypt$${'a'.repeat(32)}$${'b'.repeat(128)}`],
    ['too many parts', `scrypt$${'a'.repeat(32)}$${'b'.repeat(128)}$extra`],
    ['short salt', `scrypt$${'a'.repeat(30)}$${'b'.repeat(128)}`],
    ['short hash', `scrypt$${'a'.repeat(32)}$${'b'.repeat(126)}`],
    ['non-hex characters', `scrypt$${'z'.repeat(32)}$${'b'.repeat(128)}`],
    ['uppercase hex', `scrypt$${'A'.repeat(32)}$${'B'.repeat(128)}`],
  ])(
    'returns false (does not throw) for a malformed stored value: %s',
    async (_label, stored) => {
      await expect(verifyPassword('anything', stored)).resolves.toBe(false);
    },
  );

  it('returns false for non-string input', async () => {
    await expect(verifyPassword(undefined, null)).resolves.toBe(false);
    await expect(verifyPassword('x', 42)).resolves.toBe(false);
  });

  it('compares hashes with crypto.timingSafeEqual', async () => {
    const stored = await hashPassword('correct horse');
    const spy = vi.spyOn(crypto, 'timingSafeEqual');

    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('wrong horse', stored)).toBe(false);

    expect(spy).toHaveBeenCalledTimes(2);
    const [actual, expected] = spy.mock.calls[0];
    expect((actual as Buffer).length).toBe(64);
    expect((expected as Buffer).length).toBe(64);
  });

  it('does not call timingSafeEqual for malformed input', async () => {
    const spy = vi.spyOn(crypto, 'timingSafeEqual');
    await verifyPassword('anything', 'scrypt$bad$value');
    expect(spy).not.toHaveBeenCalled();
  });
});
