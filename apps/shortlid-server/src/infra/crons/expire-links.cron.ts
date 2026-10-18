import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

const THIRTY_DAYS = 2_592_000_000

@Injectable()
export class ExpireLinksCron {
  private readonly logger = new Logger(ExpireLinksCron.name)
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: 'America/Sao_Paulo' })
  async execute() {
    const result = await this.urlRepository.deleteExpiredLinks(this.calculateThirtyDaysAgo())
    this.logger.debug(`Expired links deleted: ${result}`)
  }

  private calculateThirtyDaysAgo(): Date {
    const thirtyDaysAgo = Date.now() - THIRTY_DAYS
    return new Date(thirtyDaysAgo)
  }
}
