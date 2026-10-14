import { env } from '@/env'
import { FileShare } from '@domain/entities/file-share.entity'
import type { IFileStorageService } from '@domain/services/file-storage.service'
import {
  EXPIRATION_HOURS,
  MAX_SHARE_BYTES,
  MAX_SHARE_FILES,
  type ExpirationHours,
  type UploadFile,
} from '@domain/sharing'
import { GetShareUsecase } from '@app/usecases/shares/get-share.usecase'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

@Injectable()
export class CreateShareUsecase {
  private readonly logger = new Logger(CreateShareUsecase.name)

  constructor(
    @Inject('IShareRepository') private readonly shares: IShareRepository,
    @Inject('IFileStorageService') private readonly storage: IFileStorageService,
    private readonly getShare: GetShareUsecase,
  ) {}

  async execute(input: { expiresIn: ExpirationHours; files: AsyncIterable<UploadFile> }) {
    if (!EXPIRATION_HOURS.includes(input.expiresIn))
      throw new BadRequestException('Invalid expiration')
    const id = randomUUID()
    const managementToken = randomBytes(32).toString('base64url')
    const now = new Date()
    const uploadDeadline = AbortSignal.timeout(10 * 60 * 1000)
    const cleanupAfter = new Date(now.getTime() + 30 * 60 * 1000)
    await this.shares.create(
      new FileShare(
        id,
        createHash('sha256').update(managementToken).digest('hex'),
        'uploading',
        now,
        cleanupAfter,
      ),
    )

    let totalBytes = 0
    let count = 0
    try {
      for await (const file of input.files) {
        count += 1
        if (count > MAX_SHARE_FILES)
          throw new BadRequestException('A share can contain at most 10 files')
        const name = file.name
          .split(/[\\/]/)
          .pop()
          // eslint-disable-next-line no-control-regex -- Strip control characters from download filenames.
          ?.replace(/[\u0000-\u001f\u007f]/g, '')
          .trim()
        if (!name || name.length > 255) throw new BadRequestException('Invalid filename')
        const fileId = randomUUID()
        const pathname = `filelid/${id}/${fileId}`
        // Reserve the path before uploading so the cleanup job can find interrupted uploads.
        await this.shares.addFile({
          id: fileId,
          shareId: id,
          pathname,
          name,
          contentType: file.contentType,
          size: 0,
        })
        let size = 0
        const content = (async function* () {
          for await (const chunk of file.content) {
            size += chunk.byteLength
            totalBytes += chunk.byteLength
            if (totalBytes > MAX_SHARE_BYTES)
              throw new PayloadTooLargeException('A share can contain at most 100 MB')
            yield chunk
          }
        })()
        await this.storage.upload(pathname, content, uploadDeadline)
        await this.shares.updateFileSize(fileId, size)
      }
      if (count === 0) throw new BadRequestException('Choose at least one file')
      const expiresAt = new Date(Date.now() + input.expiresIn * 60 * 60 * 1000)
      if (!(await this.shares.complete(id, expiresAt)))
        throw new ConflictException('Upload session expired')
      return {
        share: await this.getShare.execute(id),
        shareUrl: `${env.FILELID_WEB_URL}/s/${id}`,
        managementToken,
      }
    } catch (error) {
      try {
        // A failed request can still finish remotely. Keep paths past the upload deadline for a final sweep.
        await this.shares.markDeleting(id, cleanupAfter)
        const share = await this.shares.findById(id)
        if (share) await this.storage.delete(share.files.map((file) => file.pathname))
      } catch (cleanupError) {
        this.logger.error('Upload cleanup failed; scheduled cleanup will retry', cleanupError)
      }
      throw error
    }
  }
}
