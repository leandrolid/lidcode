import type { Readable } from 'node:stream'

export interface IFileStorageService {
  upload(
    pathname: string,
    content: AsyncIterable<Uint8Array>,
    abortSignal: AbortSignal,
  ): Promise<void>
  download(pathname: string): Promise<Readable | null>
  delete(pathnames: string[]): Promise<void>
}
