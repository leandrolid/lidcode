import { env } from '@/env'
import type { IFileStorageService } from '@domain/services/file-storage.service'
import { Injectable } from '@nestjs/common'
import { del, get, put } from '@vercel/blob'
import { Readable } from 'node:stream'

@Injectable()
export class FileStorageService implements IFileStorageService {
  async upload(pathname: string, content: AsyncIterable<Uint8Array>, abortSignal: AbortSignal) {
    const stream = Readable.from(content, { objectMode: false })
    try {
      await put(pathname, stream, {
        access: 'private',
        token: env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        contentType: 'application/octet-stream',
        multipart: true,
        abortSignal,
      })
    } finally {
      stream.destroy()
    }
  }

  async download(pathname: string) {
    const result = await get(pathname, {
      access: 'private',
      token: env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    })
    if (!result || result.statusCode !== 200) return null
    return Readable.from(result.stream, { objectMode: false })
  }

  async delete(pathnames: string[]) {
    if (pathnames.length === 0) return
    await del(pathnames, { token: env.BLOB_READ_WRITE_TOKEN })
  }
}
