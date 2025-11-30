import { HttpStatusCode, Injectable, ServerError } from '@lidcode/framework'
import IORedis from 'ioredis'

@Injectable()
export class RedisClientAdapter {
  private readonly client = new IORedis({
    maxRetriesPerRequest: null,
  })

  async set(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.set(key, value)
      if (result !== 'OK') {
        throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to set value in Redis')
      }
      return true
    } catch (error) {
      if (error instanceof ServerError) throw error
      console.error('Redis SET error:', error)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Redis SET operation failed')
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Redis GET operation failed')
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error('Redis INCR error:', error)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Redis INCR operation failed')
    }
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      console.error('Redis DEL error:', error)
      throw new ServerError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Redis DEL operation failed')
    }
  }
}
