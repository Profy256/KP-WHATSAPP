import type { AiConfig, Business, PlatformConfig } from '@prisma/client';

/**
 * Tiny in-process TTL cache for the hot, read-mostly lookups on the per-message
 * path. Every inbound WhatsApp message previously re-read the business, its
 * AiConfig and the platform config from Postgres; under load that query
 * fan-out dominates. These rarely change, so a short TTL plus explicit
 * invalidation on writes removes most of those reads.
 *
 * NOTE: single-process only. When the backend is sharded into per-tenant
 * workers this must move to a shared store (Redis) — see the scalability notes.
 */
class TtlCache<T> {
  private store = new Map<string, { value: T; expires: number }>();

  constructor(private readonly ttlMs: number) {}

  /** Returns the cached value (including a cached `null`), or undefined on miss/expiry. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  /** Returns the cached value, or runs `loader`, caches its result, and returns it. */
  async getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await loader();
    this.set(key, value);
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

// Business and AiConfig are keyed by businessId; AiConfig is invalidated
// explicitly when the owner edits it, so it can carry a longer TTL.
export const businessCache = new TtlCache<Business | null>(60_000);
export const aiConfigCache = new TtlCache<AiConfig | null>(60_000);
// Platform config is global (admin-managed); a short TTL lets key/model changes
// take effect without an explicit invalidation hook.
export const platformConfigCache = new TtlCache<PlatformConfig | null>(30_000);
export const PLATFORM_CONFIG_KEY = 'default';
