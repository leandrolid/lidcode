import { Inject, Injectable } from '@nestjs/common'
import type { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'

/**
 * Redis-backed TTL storage interface
 * Designed for Better Auth secondaryStorage implementation in US-005
 */
@Injectable()
export class RedisStorageService {
  constructor(@Inject('RedisClientAdapter') private readonly redis: RedisClientAdapter) {}

  /**
   * Store value with optional TTL
   * @param key Storage key
   * @param value String value to store
   * @param ttlSeconds Optional time-to-live in seconds
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.redis.set(key, value, ttlSeconds)
  }

  /**
   * Retrieve value by key
   * @param key Storage key
   * @returns Value or null if not found/expired
   */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  /**
   * Delete value by key
   * @param key Storage key
   * @returns Number of keys deleted (0 or 1)
   */
  async delete(key: string): Promise<number> {
    return this.redis.delete(key)
  }
}
