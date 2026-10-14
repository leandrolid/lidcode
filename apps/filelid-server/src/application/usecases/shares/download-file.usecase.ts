import type { IFileStorageService } from '@domain/services/file-storage.service'
import { GetShareUsecase } from '@app/usecases/shares/get-share.usecase'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class DownloadFileUsecase {
  constructor(
    private readonly getShare: GetShareUsecase,
    @Inject('IShareRepository') private readonly shares: IShareRepository,
    @Inject('IFileStorageService') private readonly storage: IFileStorageService,
  ) {}

  async execute(input: { shareId: string; fileId: string }) {
    await this.getShare.execute(input.shareId)
    const share = await this.shares.findById(input.shareId)
    const file = share?.files.find((file) => file.id === input.fileId)
    if (!file) throw new NotFoundException('File not found')
    const stream = await this.storage.download(file.pathname)
    if (!stream) throw new NotFoundException('File not found')
    // Blob access may take time; check expiration again before starting the response.
    try {
      await this.getShare.execute(input.shareId)
      return { file, stream }
    } catch (error) {
      stream.destroy()
      throw error
    }
  }
}
