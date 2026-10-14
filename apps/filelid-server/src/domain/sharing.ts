export const MAX_SHARE_BYTES = 100 * 1024 * 1024
export const MAX_SHARE_FILES = 10
export const EXPIRATION_HOURS = [1, 24, 168] as const
export type ExpirationHours = (typeof EXPIRATION_HOURS)[number]

export type UploadFile = {
  name: string
  contentType: string
  content: AsyncIterable<Uint8Array>
}

export type PublicShare = {
  id: string
  createdAt: Date
  expiresAt: Date
  files: { id: string; name: string; size: number; contentType: string }[]
}
