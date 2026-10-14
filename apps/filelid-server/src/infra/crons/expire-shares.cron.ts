import { CleanupSharesUsecase } from '@app/usecases/shares/cleanup-shares.usecase'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class ExpireSharesCron {
  constructor(private readonly cleanupShares: CleanupSharesUsecase) {}

  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  execute() {
    return this.cleanupShares.execute()
  }
}
