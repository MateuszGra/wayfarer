import { describe, expect, it } from 'vitest';
import { AttemptLimiter } from './attemptLimiter';

const NOW = new Date('2026-11-20T10:00:00Z');
const at = (ms: number) => new Date(NOW.getTime() + ms);
const WINDOW = 60_000;

// Arrange helper: that many attempts from one address at one moment.
const attempts = (limiter: AttemptLimiter, times: number, when = NOW) => {
  for (let i = 0; i < times; i++) limiter.attempt('203.0.113.7', when);
};

describe('AttemptLimiter', () => {
  it('allows the last attempt within the limit', () => {
    const limiter = new AttemptLimiter(3, WINDOW);
    attempts(limiter, 2);

    expect(limiter.attempt('203.0.113.7', NOW)).toBe(true);
  });

  it('refuses the first attempt over the limit', () => {
    const limiter = new AttemptLimiter(3, WINDOW);
    attempts(limiter, 3);

    expect(limiter.attempt('203.0.113.7', NOW)).toBe(false);
  });

  it('counts each address on its own', () => {
    const limiter = new AttemptLimiter(3, WINDOW);
    attempts(limiter, 3);

    expect(limiter.attempt('198.51.100.1', NOW)).toBe(true);
  });

  it('still refuses one moment before the window has passed', () => {
    const limiter = new AttemptLimiter(3, WINDOW);
    attempts(limiter, 3);

    expect(limiter.attempt('203.0.113.7', at(WINDOW - 1))).toBe(false);
  });

  it('allows again once the window has passed', () => {
    const limiter = new AttemptLimiter(3, WINDOW);
    attempts(limiter, 3);

    expect(limiter.attempt('203.0.113.7', at(WINDOW))).toBe(true);
  });
});
