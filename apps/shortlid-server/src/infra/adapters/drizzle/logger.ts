import { Logger } from '@nestjs/common'
import type { Logger as DrizzleLogger } from 'drizzle-orm'

export class CustomDrizzleLogger implements DrizzleLogger {
  private logger = new Logger('DrizzleORM')
  logQuery(query: string, params: string[]): void {
    this.logger.debug(
      params.reduce((acc, curr) => acc.replace(/\$\d+/, this.formatParam(curr)), query),
    )
  }

  private formatParam(param: unknown): string {
    if (param === null || param === undefined) {
      return 'NULL'
    }
    if (typeof param === 'string') {
      return `'${param.replace(/(^'|'$)/g, '')}'`
    }
    if (param instanceof Date) {
      return `'${param.toISOString()}'`
    }
    if (typeof param === 'object') {
      return `'${JSON.stringify(param).replace(/(^'|'$)/g, '')}'`
    }
    return String(param)
  }
}
