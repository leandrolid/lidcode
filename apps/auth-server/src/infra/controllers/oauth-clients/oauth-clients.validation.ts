import { z } from 'zod'

const redirectSchema = z
  .url()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value)
      if (url.username || url.password || url.hash || /\*|%2a/i.test(value)) return false
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      if (loopback)
        return /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/.test(value)
      return url.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Use an exact HTTPS callback, or an explicit HTTP loopback callback')

export const clientConfigurationSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    redirectUris: z.array(redirectSchema).min(1).max(10),
    scopes: z
      .array(z.enum(['openid', 'profile', 'email', 'offline_access']))
      .min(1)
      .max(4)
      .refine((scopes) => new Set(scopes).size === scopes.length, 'Scopes must be unique'),
  })
  .strict()

export const clientUpdateSchema = clientConfigurationSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, 'Provide client metadata to update')

export const clientStatusSchema = z.object({ enabled: z.boolean() }).strict()

export function clientApplicationType(redirectUris: string[]) {
  // The provider's native URI policy permits explicit loopback callbacks; authentication stays confidential.
  return redirectUris.some((uri) => uri.startsWith('http:'))
    ? ('native' as const)
    : ('web' as const)
}
