import { FileShare, type SharedFile } from '@domain/entities/file-share.entity'
import { InjectDrizzle, type Drizzle } from '@infra/adapters/drizzle/client'
import { fileShares, sharedFiles } from '@infra/adapters/drizzle/schemas'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import { Injectable } from '@nestjs/common'
import { and, asc, eq, gt, lte } from 'drizzle-orm'

@Injectable()
export class ShareRepository implements IShareRepository {
  constructor(@InjectDrizzle() private readonly database: Drizzle) {}

  async create(share: FileShare) {
    await this.database.insert(fileShares).values({
      id: share.id,
      managementTokenHash: share.managementTokenHash,
      status: share.status,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
    })
  }

  async addFile(file: SharedFile) {
    await this.database.insert(sharedFiles).values(file)
  }

  async updateFileSize(id: string, size: number) {
    await this.database.update(sharedFiles).set({ size }).where(eq(sharedFiles.id, id))
  }

  async complete(id: string, expiresAt: Date) {
    const rows = await this.database
      .update(fileShares)
      .set({ status: 'ready', expiresAt })
      .where(
        and(
          eq(fileShares.id, id),
          eq(fileShares.status, 'uploading'),
          gt(fileShares.expiresAt, new Date()),
        ),
      )
      .returning({ id: fileShares.id })
    return rows.length > 0
  }

  async findById(id: string) {
    const [share] = await this.database.select().from(fileShares).where(eq(fileShares.id, id))
    if (!share) return null
    const files = await this.database
      .select()
      .from(sharedFiles)
      .where(eq(sharedFiles.shareId, id))
      .orderBy(asc(sharedFiles.id))
    return new FileShare(
      share.id,
      share.managementTokenHash,
      share.status,
      share.createdAt,
      share.expiresAt,
      files,
    )
  }

  async findExpired(now: Date) {
    const shares = await this.database
      .select()
      .from(fileShares)
      .where(lte(fileShares.expiresAt, now))
      .orderBy(asc(fileShares.expiresAt))
      .limit(100)
    return shares.map(
      (share) =>
        new FileShare(
          share.id,
          share.managementTokenHash,
          share.status,
          share.createdAt,
          share.expiresAt,
        ),
    )
  }

  async markDeleting(id: string, deleteAfter = new Date()) {
    await this.database
      .update(fileShares)
      .set({ status: 'deleting', expiresAt: deleteAfter })
      .where(eq(fileShares.id, id))
  }

  async delete(id: string) {
    await this.database.delete(fileShares).where(eq(fileShares.id, id))
  }
}
