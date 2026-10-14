import type { FileShare, SharedFile } from '@domain/entities/file-share.entity'

export interface IShareRepository {
  create(share: FileShare): Promise<void>
  addFile(file: SharedFile): Promise<void>
  updateFileSize(id: string, size: number): Promise<void>
  complete(id: string, expiresAt: Date): Promise<boolean>
  findById(id: string): Promise<FileShare | null>
  findExpired(now: Date): Promise<FileShare[]>
  markDeleting(id: string, deleteAfter?: Date): Promise<void>
  delete(id: string): Promise<void>
}
