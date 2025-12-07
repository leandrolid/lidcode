import { env } from '@/env'
import { InternalServerErrorException, Logger } from '@nestjs/common'
import IORedis from 'ioredis'

// @Injectable()
export class RedisClientAdapter {
  private readonly logger = new Logger('Redis')
  private readonly client = new IORedis(env.REDIS_URL, {
    tls: /rediss?:\/\/(.*?):(.*?)/.test(env.REDIS_URL) ? { rejectUnauthorized: false } : undefined,
  })

  constructor() {
    this.client.on('error', (error) => {
      this.logger.error(error)
    })
  }

  async set(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.set(key, value)
      if (result !== 'OK') {
        throw new InternalServerErrorException('Failed to set value in Redis')
      }
      return true
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error
      console.error('Redis SET error:', error)
      throw new InternalServerErrorException('Redis SET operation failed')
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      throw new InternalServerErrorException('Redis GET operation failed')
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error('Redis INCR error:', error)
      throw new InternalServerErrorException('Redis INCR operation failed')
    }
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
      throw new InternalServerErrorException('Redis DEL operation failed')
    }
  }
}
