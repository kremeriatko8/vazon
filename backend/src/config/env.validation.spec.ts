import { parseCorsOrigins, validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('applies defaults when only DATABASE_URL is provided', () => {
    const env = validateEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5440/vazon' });
    expect(env.PORT).toBe(3100);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGINS).toBe('http://localhost:5180');
  });

  it('converts PORT from a string to a number', () => {
    const env = validateEnv({ DATABASE_URL: 'postgresql://x', PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/Invalid environment configuration/);
  });

  it('throws when PORT is not a valid port number', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgresql://x', PORT: 'abc' })).toThrow();
  });
});

describe('parseCorsOrigins', () => {
  it('splits a comma-separated list and trims whitespace', () => {
    expect(parseCorsOrigins('http://localhost:5180, https://vazon.example ,')).toEqual([
      'http://localhost:5180',
      'https://vazon.example',
    ]);
  });
});
