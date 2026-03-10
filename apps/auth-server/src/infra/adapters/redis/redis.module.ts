import { Module } from '@nestjs/common'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'

const RedisAsyncProvider = {
  provide: 'RedisClientAdapter',
  useFactory: async (): Promise<RedisClientAdapter> => {
    const redis = new RedisClientAdapter()
    await redis.connect()
    return redis
  },
}

@Module({
  providers: [RedisAsyncProvider],
  exports: ['RedisClientAdapter'],
})
export class RedisModule {}
