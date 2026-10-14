export type SharedFile = { id: string; name: string; size: number; contentType: string }
export type Share = { id: string; createdAt: string; expiresAt: string; files: SharedFile[] }
export type CreatedShare = { share: Share; shareUrl: string; managementToken: string }

const apiBase = (import.meta.env.VITE_FILELID_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

function errorMessage(body: unknown, status: number): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  )
    return body.message
  if (status === 413) return 'Your files are too large. Keep the total under 100 MB.'
  if (status === 429) return 'A few too many requests. Give it a minute and try again.'
  return 'Something went wrong. Please try again.'
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
    request.onerror = () =>
      reject(new Error('Could not reach Filelid. Check your connection and try again.'))
    request.ontimeout = () => reject(new Error('The upload timed out. Please try again.'))
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
