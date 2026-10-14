import { PurgeShareUsecase } from '@app/usecases/shares/purge-share.usecase'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class CleanupSharesUsecase {
  private readonly logger = new Logger(CleanupSharesUsecase.name)

  constructor(
    @Inject('IShareRepository') private readonly shares: IShareRepository,
    private readonly purgeShare: PurgeShareUsecase,
  ) {}

  async execute() {
    const shares = await this.shares.findExpired(new Date())
    for (const share of shares) {
      try {
        await this.purgeShare.execute(share.id)
      } catch (error) {
        this.logger.error(`Cleanup failed for share ${share.id}; will retry next minute`, error)
      }
    }
  }
}
