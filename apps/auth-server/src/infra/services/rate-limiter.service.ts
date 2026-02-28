import { Inject, Injectable } from '@nestjs/common'
import type { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'

export type RateLimitResult = {
  allowed: boolean
  current: number
  limit: number
  remainingSeconds: number
}

/**
 * Redis-backed rate limiting service
 * Uses sliding window counter pattern for auth endpoints in US-005
 */
@Injectable()
export class RateLimiterService {
  constructor(@Inject('RedisClientAdapter') private readonly redis: RedisClientAdapter) {}

  /**
   * Check and increment rate limit counter
   * @param identifier Unique identifier (e.g., email, IP)
   * @param limit Maximum allowed attempts
   * @param windowSeconds Time window in seconds
   * @returns Rate limit status
   */
  async checkLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`
    const current = await this.redis.incrementWithExpiry(key, windowSeconds)
    const ttl = await this.redis.getTTL(key)

    return {
      allowed: current <= limit,
      current,
      limit,
      remainingSeconds: ttl > 0 ? ttl : windowSeconds,
    }
  }

  /**
   * Reset rate limit counter for identifier
   * @param identifier Unique identifier to reset
   */
  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`
    await this.redis.delete(key)
  }
}
