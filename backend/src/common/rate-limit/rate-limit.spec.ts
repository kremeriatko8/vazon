import { RateLimiter } from './rate-limit.js';

describe('RateLimiter', () => {
  const options = { limit: 3, windowMs: 60_000 };

  it('allows up to the limit, then asks to wait', () => {
    const limiter = new RateLimiter();
    expect(limiter.hit('a', options, 0)).toBe(0);
    expect(limiter.hit('a', options, 1_000)).toBe(0);
    expect(limiter.hit('a', options, 2_000)).toBe(0);
    expect(limiter.hit('a', options, 3_000)).toBe(57);
  });

  it('frees a slot when the oldest hit leaves the window', () => {
    const limiter = new RateLimiter();
    for (const t of [0, 1_000, 2_000]) limiter.hit('a', options, t);
    expect(limiter.hit('a', options, 60_001)).toBe(0);
  });

  it('counts each key on its own', () => {
    const limiter = new RateLimiter();
    for (const t of [0, 1, 2]) limiter.hit('a', options, t);
    expect(limiter.hit('b', options, 3)).toBe(0);
  });
});
