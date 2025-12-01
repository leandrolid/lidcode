import type { ICounterService } from '@domain/services/counter.service'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { Injectable } from '@leandrolid/framework'

@Injectable({
  token: 'ICounterService',
})
export class CounterService implements ICounterService {
  constructor(private readonly redisClientAdapter: RedisClientAdapter) {}

  getCountFor(id: string): Promise<number> {
    return this.redisClientAdapter.increment(id)
  }
}
