import { Module } from '@nestjs/common'
import { DrizzleModuleProvider } from '@infra/adapters/drizzle/client'

@Module({
  providers: [DrizzleModuleProvider],
  exports: ['DrizzleAsyncProvider', DrizzleModuleProvider],
})
export class DrizzleModule {}
