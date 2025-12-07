import { env } from '@/env'
import type { IShortCodeService } from '@domain/services/short-code.service'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import Hashids from 'hashids'

@Injectable()
export class ShortCodeService implements IShortCodeService {
  private readonly hashids: Hashids
  private readonly logger = new Logger(ShortCodeService.name)

  constructor() {
    this.hashids = new Hashids(
      env.HASH_CODE_SALT,
      3,
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    )
  }

  createFromId(id: number): string {
    return this.hashids.encode(id)
  }

  getIdFromCode(hash: string): number | bigint {
    try {
      const [decoded] = this.hashids.decode(hash)
      if (!decoded) {
        throw new BadRequestException('Invalid short code')
      }
      return decoded
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error(error)
      throw new BadRequestException('Invalid short code')
    }
  }
}
