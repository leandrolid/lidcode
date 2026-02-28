import type { RedisStorageService } from '@infra/services/redis-storage.service'

/**
 * Better Auth secondaryStorage adapter backed by Redis
 * Provides TTL-based storage for sessions, tokens, and temporary auth data
 */
export function createSecondaryStorageAdapter(redisStorage: RedisStorageService) {
  return {
    async get(key: string): Promise<string | null> {
      return redisStorage.get(key)
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      await redisStorage.set(key, value, ttl)
    },

    async delete(key: string): Promise<void> {
      await redisStorage.delete(key)
    },
  }
}
