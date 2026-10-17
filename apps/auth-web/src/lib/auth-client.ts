import { createAuthClient } from 'better-auth/react'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'

export const authClient = createAuthClient({ plugins: [oauthProviderClient()] })

export function oauthSearch(search = window.location.search) {
  const params = new URLSearchParams(search)
  if (!params.has('sig')) return ''
  for (const key of ['token', 'error', 'callbackURL']) params.delete(key)
  return `?${params}`
}

export function finishAuthentication(data: unknown, fallback = '/profile') {
  if (data && typeof data === 'object' && 'redirect' in data && data.redirect === true &&
    'url' in data && typeof data.url === 'string') {
    // The native client already handles provider redirects; a second navigation races the callback.
    return
  } else window.location.assign(fallback)
}
