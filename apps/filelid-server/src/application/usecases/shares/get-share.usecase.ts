import type { PublicShare } from '@domain/sharing'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { GoneException, Inject, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class GetShareUsecase {
  constructor(@Inject('IShareRepository') private readonly shares: IShareRepository) {}

  async execute(id: string): Promise<PublicShare> {
    const share = await this.shares.findById(id)
    if (!share || share.status === 'uploading') throw new NotFoundException('Share not found')
    if (share.status !== 'ready' || share.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('This share has expired or was deleted')
    }
    return {
      id: share.id,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      files: share.files.map(({ id, name, size, contentType }) => ({
        id,
        name,
        size,
        contentType,
      })),
    }
  }
}
