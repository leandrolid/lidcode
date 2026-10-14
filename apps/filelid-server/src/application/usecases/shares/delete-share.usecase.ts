import { PurgeShareUsecase } from '@app/usecases/shares/purge-share.usecase'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { createHash, timingSafeEqual } from 'node:crypto'

@Injectable()
export class DeleteShareUsecase {
  constructor(
    @Inject('IShareRepository') private readonly shares: IShareRepository,
    private readonly purgeShare: PurgeShareUsecase,
  ) {}

  async execute(input: { id: string; managementToken: string }) {
    const share = await this.shares.findById(input.id)
    if (!share) throw new NotFoundException('Share not found')
    const actual = createHash('sha256').update(input.managementToken).digest()
    const expected = Buffer.from(share.managementTokenHash, 'hex')
    if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
      throw new ForbiddenException('Invalid management token')
    }
    await this.purgeShare.execute(input.id)
  }
}
