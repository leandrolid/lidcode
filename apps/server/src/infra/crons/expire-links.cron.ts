import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Cron, CronExpression, CronJob, TimeZones } from '@lidcode/cron'
import { Inject, Injectable, Logger } from '@lidcode/framework'

@Injectable()
@CronJob({ autoStart: true })
export class ExpireLinksCron {
  private readonly logger = new Logger(ExpireLinksCron.name)
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: TimeZones.AMERICA_SAO_PAULO })
  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: TimeZones.AMERICA_SAO_PAULO })
  async execute() {
    const result = await this.urlRepository.deleteExpiredLinks(this.calculateThirtyDaysAgo())
    this.logger.info(`Expired links deleted: ${result}`)
  }

  private calculateThirtyDaysAgo(): Date {
    const now = new Date()
    now.setDate(now.getDate() - 30)
    return now
  }
}
