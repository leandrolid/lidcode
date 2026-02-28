import { env } from '@/env'
import { InternalServerErrorException, Logger } from '@nestjs/common'
import IORedis from 'ioredis'

export class RedisClientAdapter {
  private readonly logger = new Logger('Redis')
  private readonly client: IORedis

  constructor() {
    this.client = new IORedis(env.REDIS_URL, {
      tls: /^rediss:\/\//.test(env.REDIS_URL) ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`)
    })
  }

  /**
   * Initialize connection with fail-fast validation
   * Throws clear error if Redis is unreachable
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect()
      const result = await this.client.ping()
      if (result !== 'PONG') {
        throw new Error(`Unexpected PING response: ${result}`)
      }
      this.logger.log('Redis connection established')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during Redis connection'
      this.logger.error(`Failed to connect to Redis: ${message}`)
      throw new InternalServerErrorException(
        `Redis connection failed (REDIS_URL=${env.REDIS_URL}): ${message}`,
      )
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit()
  }

  // ===== TTL Storage Operations (for Better Auth secondaryStorage) =====

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        const result = await this.client.setex(key, ttlSeconds, value)
        if (result !== 'OK') {
          throw new Error(`Unexpected SETEX response: ${result}`)
        }
      } else {
        const result = await this.client.set(key, value)
        if (result !== 'OK') {
          throw new Error(`Unexpected SET response: ${result}`)
        }
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Redis SET error for key '${key}': ${message}`)
      throw new InternalServerErrorException(`Redis SET operation failed: ${message}`)
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Redis GET error for key '${key}': ${message}`)
      throw new InternalServerErrorException(`Redis GET operation failed: ${message}`)
    }
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Redis DEL error for key '${key}': ${message}`)
      throw new InternalServerErrorException(`Redis DEL operation failed: ${message}`)
    }
  }

  // ===== Rate Limiting Operations =====

  /**
   * Increment counter with automatic expiry (for rate limiting)
   * Returns current count after increment
   */
  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    try {
      const count = await this.client.incr(key)
      // Only set TTL on first increment to avoid resetting window
      if (count === 1) {
        await this.client.expire(key, ttlSeconds)
      }
      return count
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Redis INCR error for key '${key}': ${message}`)
      throw new InternalServerErrorException(`Redis INCR operation failed: ${message}`)
    }
  }

  /**
   * Get TTL (remaining seconds) for a key
   * Returns -1 if key has no expiry, -2 if key does not exist
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Redis TTL error for key '${key}': ${message}`)
      throw new InternalServerErrorException(`Redis TTL operation failed: ${message}`)
    }
  }
}
