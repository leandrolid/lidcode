export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: 'user' | 'admin'
}

export async function fetchClient<T>(path: string, init?: RequestInit): Promise<[T, null] | [null, Error]> {
  try {
    const response = await fetch(path, { ...init, credentials: 'same-origin' })
    const data = await response.json()
    if (!response.ok) return [null, new Error(data.message ?? data.issues?.[0]?.message ?? data.error ?? 'Request failed. Please try again.')]
    return [data as T, null]
  } catch {
    return [null, new Error('Unable to connect. Please try again.')]
  }
}

export function jsonRequest(body: unknown, method = 'POST'): RequestInit {
  return { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
}
