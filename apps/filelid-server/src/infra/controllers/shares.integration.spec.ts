jest.mock('@/env', () => ({ env: { FILELID_WEB_URL: 'http://localhost:3002' } }))

import { CreateShareUsecase } from '@app/usecases/shares/create-share.usecase'
import { CleanupSharesUsecase } from '@app/usecases/shares/cleanup-shares.usecase'
import { DeleteShareUsecase } from '@app/usecases/shares/delete-share.usecase'
import { DownloadFileUsecase } from '@app/usecases/shares/download-file.usecase'
import { GetShareUsecase } from '@app/usecases/shares/get-share.usecase'
import { PurgeShareUsecase } from '@app/usecases/shares/purge-share.usecase'
import type { FileShare } from '@domain/entities/file-share.entity'
import type { IFileStorageService } from '@domain/services/file-storage.service'
import { HttpExceptionFilter } from '@infra/adapters/nest/error-handler'
import { CreateShareController } from '@infra/controllers/create-share/create-share.controller'
import { DeleteShareController } from '@infra/controllers/delete-share/delete-share.controller'
import { DownloadFileController } from '@infra/controllers/download-file/download-file.controller'
import { GetShareController } from '@infra/controllers/get-share/get-share.controller'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import multipart from '@fastify/multipart'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE, NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { ZodValidationPipe } from 'nestjs-zod'
import { Readable } from 'node:stream'

const records = new Map<string, FileShare>()
const blobs = new Map<string, Buffer>()
const repository: IShareRepository = {
  async create(share) {
    records.set(share.id, share)
  },
  async addFile(file) {
    records.get(file.shareId)?.files.push(file)
  },
  async updateFileSize(id, size) {
    for (const share of records.values()) {
      const file = share.files.find((file) => file.id === id)
      if (file) file.size = size
    }
  },
  async complete(id, expiresAt) {
    const share = records.get(id)
    if (!share) return false
    share.status = 'ready'
    share.expiresAt = expiresAt
    return true
  },
  async findById(id) {
    return records.get(id) ?? null
  },
  async findExpired(now) {
    return [...records.values()].filter((share) => share.expiresAt <= now)
  },
  async markDeleting(id, deleteAfter = new Date()) {
    const share = records.get(id)
    if (share) {
      share.status = 'deleting'
      share.expiresAt = deleteAfter
    }
  },
  async delete(id) {
    records.delete(id)
  },
}
const storage: IFileStorageService = {
  async upload(pathname, content) {
    const chunks: Uint8Array[] = []
    for await (const chunk of content) chunks.push(chunk)
    blobs.set(pathname, Buffer.concat(chunks))
  },
  async download(pathname) {
    const blob = blobs.get(pathname)
    return blob ? Readable.from([blob]) : null
  },
  async delete(pathnames) {
    for (const pathname of pathnames) blobs.delete(pathname)
  },
}

@Module({
  controllers: [
    CreateShareController,
    GetShareController,
    DownloadFileController,
    DeleteShareController,
  ],
  providers: [
    CreateShareUsecase,
    GetShareUsecase,
    DownloadFileUsecase,
    DeleteShareUsecase,
    PurgeShareUsecase,
    CleanupSharesUsecase,
    { provide: 'IShareRepository', useValue: repository },
    { provide: 'IFileStorageService', useValue: storage },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
class TestApiModule {}

let app: NestFastifyApplication
beforeAll(async () => {
  app = await NestFactory.create<NestFastifyApplication>(TestApiModule, new FastifyAdapter(), {
    logger: false,
  })
  // A smaller per-file cap exercises real multipart truncation without a 100 MB fixture.
  await app.register(multipart, {
    throwFileSizeLimit: false,
    limits: { files: 10, fields: 0, parts: 10, fileSize: 16 },
  })
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
})
afterAll(async () => {
  await app?.close()
})
beforeEach(() => {
  records.clear()
  blobs.clear()
})

async function createUpload(contents = ['hello', 'goodbye'], expiresIn = 24) {
  const form = new FormData()
  contents.forEach((text, index) =>
    form.append('files', new Blob([text], { type: 'text/plain' }), `file-${index}.txt`),
  )
  const request = new Request('http://localhost/v1/shares', { method: 'POST', body: form })
  return app.inject({
    method: 'POST',
    url: `/v1/shares?expiresIn=${expiresIn}`,
    headers: { 'content-type': request.headers.get('content-type')! },
    payload: Buffer.from(await request.arrayBuffer()),
  })
}

describe('Anonymous share HTTP flow', () => {
  it('creates a real multipart share, serves attachments, and deletes with the owner token', async () => {
    const response = await createUpload()
    expect(response.statusCode).toBe(201)
    const result = response.json<{
      share: { id: string; files: { id: string }[] }
      managementToken: string
    }>()
    expect(result.share.files).toHaveLength(2)
    const metadata = await app.inject({ method: 'GET', url: `/v1/shares/${result.share.id}` })
    expect(metadata.statusCode).toBe(200)
    expect(metadata.body).not.toContain('pathname')
    expect(metadata.body).not.toContain('managementTokenHash')
    const file = await app.inject({
      method: 'GET',
      url: `/v1/shares/${result.share.id}/files/${result.share.files[0]!.id}`,
    })
    expect(file.statusCode).toBe(200)
    expect(file.body).toBe('hello')
    expect(file.headers['content-type']).toBe('application/octet-stream')
    expect(file.headers['content-disposition']).toContain("filename*=UTF-8''file-0.txt")
    const denied = await app.inject({ method: 'DELETE', url: `/v1/shares/${result.share.id}` })
    expect(denied.statusCode).toBe(401)
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/v1/shares/${result.share.id}`,
      headers: { authorization: `Bearer ${result.managementToken}` },
    })
    expect(deleted.statusCode).toBe(204)
    expect(blobs.size).toBe(0)
    expect(records.size).toBe(0)
    expect(
      (await app.inject({ method: 'GET', url: `/v1/shares/${result.share.id}` })).statusCode,
    ).toBe(404)
  })

  it('validates expiration before creating a reservation', async () => {
    expect((await createUpload(['hello'], 5)).statusCode).toBe(400)
    expect(records.size).toBe(0)
  })

  it('rejects truncated files and removes their uploaded prefixes', async () => {
    const response = await createUpload(['hello', 'a file longer than sixteen bytes'])
    expect(response.statusCode).toBe(413)
    expect(records.size).toBe(1)
    const [failed] = records.values()
    expect(failed?.status).toBe('deleting')
    expect(blobs.size).toBe(0)
    failed!.expiresAt = new Date(0)
    await app.get(CleanupSharesUsecase).execute()
    expect(records.size).toBe(0)
  })

  it('rejects more than ten multipart files without leaving stored files', async () => {
    const response = await createUpload(Array.from({ length: 11 }, () => 'hello'))
    expect(response.statusCode).toBe(413)
    expect(records.size).toBe(1)
    expect(blobs.size).toBe(0)
  })

  it('blocks an expired attachment while it is still present in storage', async () => {
    const result = (await createUpload(['hello'])).json<{
      share: { id: string; files: { id: string }[] }
    }>()
    records.get(result.share.id)!.expiresAt = new Date(0)
    const response = await app.inject({
      method: 'GET',
      url: `/v1/shares/${result.share.id}/files/${result.share.files[0]!.id}`,
    })
    expect(response.statusCode).toBe(410)
    expect(blobs.size).toBe(1)
  })

  it('sweeps a late Blob completion after a failed upload without losing its reserved path', async () => {
    const upload = jest
      .spyOn(storage, 'upload')
      .mockRejectedValueOnce(new Error('Upload connection lost'))
    expect((await createUpload(['hello'])).statusCode).toBe(500)
    upload.mockRestore()
    const [failed] = records.values()
    expect(failed?.status).toBe('deleting')
    const pathname = failed!.files[0]!.pathname
    blobs.set(pathname, Buffer.from('remote upload finished after the response was lost'))
    await app.get(CleanupSharesUsecase).execute()
    expect(blobs.size).toBe(1)
    failed!.expiresAt = new Date(0)
    await app.get(CleanupSharesUsecase).execute()
    expect(blobs.size).toBe(0)
    expect(records.size).toBe(0)
  })
})
