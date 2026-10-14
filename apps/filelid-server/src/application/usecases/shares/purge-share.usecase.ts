import type { IFileStorageService } from '@domain/services/file-storage.service'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class PurgeShareUsecase {
  constructor(
    @Inject('IShareRepository') private readonly shares: IShareRepository,
    @Inject('IFileStorageService') private readonly storage: IFileStorageService,
  ) {}

  async execute(id: string) {
    // Revoke access first. Retain metadata until Blob confirms deletion so failures can be retried.
    await this.shares.markDeleting(id)
    const share = await this.shares.findById(id)
    if (!share) return
    await this.storage.delete(share.files.map((file) => file.pathname))
    await this.shares.delete(id)
  }
}
