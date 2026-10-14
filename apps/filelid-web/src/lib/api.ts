import type { MessageKey } from './translations'

export type SharedFile = { id: string; name: string; size: number; contentType: string }
export type Share = { id: string; createdAt: string; expiresAt: string; files: SharedFile[] }
export type CreatedShare = { share: Share; shareUrl: string; managementToken: string }

const apiBase = (import.meta.env.VITE_FILELID_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public messageKey: MessageKey,
    public status: number,
  ) {
    super(messageKey)
  }
}

const apiErrorMessages = new Map<string, MessageKey>([
  ['Invalid expiration', 'errors.expiration'],
  ['A share can contain at most 10 files', 'errors.tooManyFiles'],
  ['Invalid filename', 'errors.filename'],
  ['Choose at least one file', 'errors.noFiles'],
  ['Upload session expired', 'errors.uploadExpired'],
  ['Share not found', 'errors.notFound'],
  ['This share has expired or was deleted', 'errors.gone'],
  ['Invalid management token', 'errors.token'],
  ['Expected a multipart file upload', 'errors.invalidUpload'],
  ['Only files fields are accepted', 'errors.invalidUpload'],
])

function errorMessage(body: unknown, status: number): MessageKey {
  if (status === 413) return 'errors.tooLarge'
  if (status === 429) return 'errors.rateLimit'
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  )
    return apiErrorMessages.get(body.message) ?? 'errors.generic'
  return 'errors.generic'
}

export function uploadShare(
  files: File[],
  expiresIn: number,
  onProgress: (progress: number) => void,
) {
  const request = new XMLHttpRequest()
  const promise = new Promise<CreatedShare>((resolve, reject) => {
    request.open('POST', `${apiBase}/v1/shares?expiresIn=${expiresIn}`)
    request.responseType = 'json'
    request.timeout = 15 * 60 * 1000
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve(request.response as CreatedShare)
      else reject(new ApiError(errorMessage(request.response, request.status), request.status))
    }
    request.onerror = () => reject(new ApiError('errors.connection', 0))
    request.ontimeout = () => reject(new ApiError('errors.timeout', 0))
    request.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))
    const form = new FormData()
    for (const file of files) form.append('files', file)
    request.send(form)
  })
  return { promise, cancel: () => request.abort() }
}

export async function getShare(id: string, signal: AbortSignal): Promise<Share> {
  const response = await fetch(`${apiBase}/v1/shares/${id}`, { signal, cache: 'no-store' })
  const body: unknown = await response.json()
  if (!response.ok) throw new ApiError(errorMessage(body, response.status), response.status)
  return body as Share
}

export async function deleteShare(id: string, token: string): Promise<void> {
  const response = await fetch(`${apiBase}/v1/shares/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const body: unknown = await response.json()
    throw new ApiError(errorMessage(body, response.status), response.status)
  }
  forgetToken(id)
}

export const downloadUrl = (shareId: string, fileId: string) =>
  `${apiBase}/v1/shares/${shareId}/files/${fileId}`

export function rememberToken(id: string, token: string): boolean {
  try {
    localStorage.setItem(`filelid:manage:${id}`, token)
    return true
  } catch {
    return false
  }
}

export function getManagementToken(id: string): string | null {
  try {
    return localStorage.getItem(`filelid:manage:${id}`)
  } catch {
    return null
  }
}

function forgetToken(id: string) {
  try {
    localStorage.removeItem(`filelid:manage:${id}`)
  } catch {
    // Deletion still succeeds when browser storage is unavailable.
  }
}
