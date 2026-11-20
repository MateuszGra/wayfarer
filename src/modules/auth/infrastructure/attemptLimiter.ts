/**
 * Counts attempts per key (a client address) in a sliding window, in this process's memory only: addresses
 * are never written anywhere. It slows down guessing spread over many accounts, which the per-account lock
 * can't see. One process serves the game, so memory is enough; a restart simply forgets.
 */
export class AttemptLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Records an attempt and says whether it is still within the limit. */
  attempt(key: string, now: Date): boolean {
    const since = now.getTime() - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((at) => at > since);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now.getTime());
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.forgetOlderThan(since);
    return true;
  }

  private forgetOlderThan(since: number): void {
    for (const [key, times] of this.hits) if (times.every((at) => at <= since)) this.hits.delete(key);
  }
}
