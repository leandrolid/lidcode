jest.mock('@/env', () => ({ env: { FILELID_WEB_URL: 'http://localhost:3002' } }))

import { FileShare } from '@domain/entities/file-share.entity'
import type { IFileStorageService } from '@domain/services/file-storage.service'
import type { UploadFile } from '@domain/sharing'
import type { IShareRepository } from '@infra/repositories/share/share.repository'
import {
  BadRequestException,
  GoneException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { CleanupSharesUsecase } from './cleanup-shares.usecase'
import { CreateShareUsecase } from './create-share.usecase'
import { DeleteShareUsecase } from './delete-share.usecase'
import { DownloadFileUsecase } from './download-file.usecase'
import { GetShareUsecase } from './get-share.usecase'
import { PurgeShareUsecase } from './purge-share.usecase'

const shares: jest.Mocked<IShareRepository> = {
  create: jest.fn(),
  addFile: jest.fn(),
  updateFileSize: jest.fn(),
  complete: jest.fn(),
  findById: jest.fn(),
  findExpired: jest.fn(),
  markDeleting: jest.fn(),
  delete: jest.fn(),
}
const storage: jest.Mocked<IFileStorageService> = {
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
}
const purge = new PurgeShareUsecase(shares, storage)
const get = new GetShareUsecase(shares)
const create = new CreateShareUsecase(shares, storage, get)
const remove = new DeleteShareUsecase(shares, purge)
const download = new DownloadFileUsecase(get, shares, storage)
const cleanup = new CleanupSharesUsecase(shares, purge)
let record: FileShare
let deleted: boolean

async function* uploads(names: string[], megabytes = 0): AsyncGenerator<UploadFile> {
  const chunk = Buffer.alloc(1024 * 1024)
  for (const name of names) {
    yield {
      name,
      contentType: 'text/plain',
      content: (async function* () {
        if (!megabytes) yield Buffer.from('hello')
        for (let index = 0; index < megabytes; index++) yield chunk
      })(),
    }
  }
}

beforeAll(() => Logger.overrideLogger(false))
beforeEach(() => {
  jest.resetAllMocks()
  deleted = false
  record = new FileShare(
    'share-id',
    createHash('sha256').update('owner-token').digest('hex'),
    'ready',
    new Date(),
    new Date(Date.now() + 60000),
  )
  shares.create.mockImplementation(async (share) => {
    record = share
  })
  shares.addFile.mockImplementation(async (file) => {
    record.files.push(file)
  })
  shares.updateFileSize.mockImplementation(async (id, size) => {
    const file = record.files.find((file) => file.id === id)
    if (file) file.size = size
  })
  shares.complete.mockImplementation(async (_id, expiresAt) => {
    record.status = 'ready'
    record.expiresAt = expiresAt
    return true
  })
  shares.findById.mockImplementation(async () => (deleted ? null : record))
  shares.markDeleting.mockImplementation(async (_id, deleteAfter) => {
    record.status = 'deleting'
    record.expiresAt = deleteAfter ?? new Date()
  })
  shares.delete.mockImplementation(async () => {
    deleted = true
  })
  shares.findExpired.mockResolvedValue([])
  storage.delete.mockResolvedValue(undefined)
  storage.upload.mockImplementation(async (_pathname, content) => {
    for await (const chunk of content) expect(chunk).toBeInstanceOf(Uint8Array)
  })
})

describe('Creating shares', () => {
  it.each([1, 24, 168] as const)(
    'streams multiple files and applies the %i-hour expiration after completion',
    async (expiresIn) => {
      const start = Date.now()
      const result = await create.execute({
        expiresIn,
        files: uploads(['../notes.txt', 'picture.png']),
      })
      expect(result.share.files.map((file) => ({ name: file.name, size: file.size }))).toEqual([
        { name: 'notes.txt', size: 5 },
        { name: 'picture.png', size: 5 },
      ])
      expect(result.share.expiresAt.getTime()).toBeGreaterThanOrEqual(start + expiresIn * 3600000)
      expect(result.shareUrl).toBe(`http://localhost:3002/s/${result.share.id}`)
      expect(record.managementTokenHash).toBe(
        createHash('sha256').update(result.managementToken).digest('hex'),
      )
      expect(result.share).not.toHaveProperty('managementTokenHash')
      expect(result.share.files[0]).not.toHaveProperty('pathname')
      expect(storage.upload).toHaveBeenCalledTimes(2)
      expect(shares.addFile.mock.invocationCallOrder[0]).toBeLessThan(
        storage.upload.mock.invocationCallOrder[0]!,
      )
    },
  )

  it('rejects an empty share and schedules its reservation for cleanup', async () => {
    await expect(create.execute({ expiresIn: 24, files: uploads([]) })).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(storage.upload).not.toHaveBeenCalled()
    expect(record.status).toBe('deleting')
  })

  it('enforces the aggregate limit across streamed files and removes already-uploaded files', async () => {
    await expect(
      create.execute({ expiresIn: 24, files: uploads(['first.bin', 'second.bin'], 51) }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException)
    expect(shares.complete).not.toHaveBeenCalled()
    expect(storage.delete).toHaveBeenCalledWith(record.files.map((file) => file.pathname))
    expect(record.status).toBe('deleting')
    expect(deleted).toBe(false)
  })

  it('rejects an eleventh file and rolls back the first ten', async () => {
    await expect(
      create.execute({
        expiresIn: 24,
        files: uploads(Array.from({ length: 11 }, (_, index) => `${index}.txt`)),
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(storage.upload).toHaveBeenCalledTimes(10)
    expect(record.status).toBe('deleting')
  })

  it('keeps failed uploads tracked when Blob deletion fails and cleans them on the next job', async () => {
    storage.upload.mockRejectedValueOnce(new Error('Upload unavailable'))
    storage.delete.mockRejectedValueOnce(new Error('Deletion unavailable'))
    await expect(create.execute({ expiresIn: 24, files: uploads(['report.pdf']) })).rejects.toThrow(
      'Upload unavailable',
    )
    expect(record.status).toBe('deleting')
    expect(record.files).toHaveLength(1)
    expect(deleted).toBe(false)
    record.expiresAt = new Date(0)
    shares.findExpired.mockResolvedValue([record])
    await cleanup.execute()
    expect(deleted).toBe(true)
  })

  it('rolls back storage if the database cannot finalize the share', async () => {
    shares.complete.mockRejectedValueOnce(new Error('Database unavailable'))
    await expect(create.execute({ expiresIn: 24, files: uploads(['report.pdf']) })).rejects.toThrow(
      'Database unavailable',
    )
    expect(storage.delete).toHaveBeenCalledTimes(1)
    expect(record.status).toBe('deleting')
    expect(deleted).toBe(false)
  })
})

describe('Access and deletion', () => {
  it('does not reveal unfinished shares', async () => {
    record.status = 'uploading'
    await expect(get.execute(record.id)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects expiration exactly at the boundary, before physical cleanup', async () => {
    record.expiresAt = new Date(Date.now())
    await expect(get.execute(record.id)).rejects.toBeInstanceOf(GoneException)
    await expect(
      download.execute({ shareId: record.id, fileId: 'file-id' }),
    ).rejects.toBeInstanceOf(GoneException)
    expect(storage.download).not.toHaveBeenCalled()
  })

  it('requires the owner token and revokes access before deleting stored files', async () => {
    await expect(remove.execute({ id: record.id, managementToken: 'wrong-token' })).rejects.toThrow(
      'Invalid management token',
    )
    expect(storage.delete).not.toHaveBeenCalled()
    storage.delete.mockImplementation(async () => {
      expect(record.status).toBe('deleting')
      await expect(get.execute(record.id)).rejects.toBeInstanceOf(GoneException)
    })
    await remove.execute({ id: record.id, managementToken: 'owner-token' })
    expect(deleted).toBe(true)
  })

  it('closes a Blob stream if the share expires while storage is being fetched', async () => {
    record.files.push({
      id: 'file-id',
      shareId: record.id,
      pathname: 'filelid/path',
      name: 'notes.txt',
      size: 5,
      contentType: 'text/plain',
    })
    const stream = Readable.from(['hello'])
    storage.download.mockImplementation(async () => {
      record.expiresAt = new Date(Date.now() - 1)
      return stream
    })
    await expect(
      download.execute({ shareId: record.id, fileId: 'file-id' }),
    ).rejects.toBeInstanceOf(GoneException)
    expect(stream.destroyed).toBe(true)
  })

  it('continues cleanup after a failed deletion instead of losing the remaining batch', async () => {
    const other = new FileShare('second-share', '', 'ready', new Date(), new Date(0))
    shares.findExpired.mockResolvedValue([record, other])
    shares.findById.mockResolvedValueOnce(record).mockResolvedValueOnce(other)
    storage.delete.mockRejectedValueOnce(new Error('Temporary failure'))
    await cleanup.execute()
    expect(shares.delete).toHaveBeenCalledTimes(1)
    expect(shares.delete).toHaveBeenCalledWith('second-share')
  })
})
