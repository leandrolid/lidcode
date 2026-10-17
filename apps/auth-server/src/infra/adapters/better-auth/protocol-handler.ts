import { z } from 'zod'
import { decodeJwt } from 'jose'
import { validateAppAccess } from '../../../application/usecases/validate-app-access.js'
import type { AuthEnv } from '../../../env.js'
import {
  credentialDigest,
  type AuthorizationStore,
} from '../../repositories/authorization-store.js'

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.number().int().positive(),
})

export const blockedProviderPaths = [
  '/token',
  '/unlink-account',
  '/update-user',
  '/oauth2/update-consent',
  '/oauth2/delete-consent',
  '/oauth2/register',
  '/oauth2/create-client',
  '/oauth2/get-client',
  '/oauth2/get-clients',
  '/oauth2/update-client',
  '/oauth2/delete-client',
  '/oauth2/client/rotate-secret',
  '/oauth2/client/rotate-keys',
]

async function protocolBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.includes('application/json')) {
    return z.record(z.string(), z.unknown()).parse(await request.clone().json())
  }
  const form = await request.clone().formData()
  for (const key of [
    'grant_type',
    'code',
    'refresh_token',
    'client_id',
    'client_secret',
    'token',
    'token_type_hint',
  ]) {
    if (form.getAll(key).length > 1) throw new Error('Duplicate protocol parameter')
  }
  return Object.fromEntries(form)
}

export function createProtocolHandler(
  nativeHandler: (request: Request) => Promise<Response>,
  store: AuthorizationStore,
  env: AuthEnv,
) {
  return async (request: Request) => {
    try {
      const pathname = new URL(request.url).pathname
      if (pathname.includes('%') || pathname.includes('//')) {
        return Response.json({ error: 'invalid_request' }, { status: 400 })
      }
      const path = pathname.replace(/\/+$/, '')
      if (
        blockedProviderPaths.some((blocked) => path === `/api/auth${blocked}`) ||
        path.startsWith('/api/auth/admin/oauth2')
      ) {
        return Response.json({ error: 'not_found' }, { status: 404 })
      }
      let input: Awaited<ReturnType<AuthorizationStore['resolve']>> = null
      if (path === '/api/auth/oauth2/token' && request.method === 'POST') {
        let body
        try {
          body = await protocolBody(request)
        } catch {
          return Response.json({ error: 'invalid_request' }, { status: 400 })
        }
        const kind = body.grant_type === 'authorization_code' ? 'code' : 'refresh'
        const credential = kind === 'code' ? body.code : body.refresh_token
        if (typeof credential === 'string') input = await store.resolve(kind, credential)
      }

      const response = await nativeHandler(request)
      if (path === '/api/auth/oauth2/introspect' && response.ok) {
        const result = await response.clone().json()
        if (result.active === true) {
          const body = await protocolBody(request)
          if (
            typeof body.token !== 'string' ||
            !(await validateAppAccess(store, body.token, result, `${env.issuer}/oauth2/userinfo`))
          ) {
            return Response.json({ active: false }, { headers: { 'cache-control': 'no-store' } })
          }
        }
      }
      if (path === '/api/auth/oauth2/userinfo' && response.ok) {
        const credential = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
        const identity = await response.clone().json()
        let claims: unknown
        if (credential?.split('.').length === 3) {
          // UserInfo already verified this exact JWT; decoding only reads its authenticated claims.
          claims = decodeJwt(credential)
        } else if (credential) {
          const access = await store.issuedAccess(credential)
          if (access)
            claims = {
              sub: access.userId,
              client_id: access.clientId,
              scope: access.scopes.join(' '),
              aud: access.resources ?? undefined,
            }
        }
        if (
          !credential ||
          !(await validateAppAccess(store, credential, claims, `${env.issuer}/oauth2/userinfo`)) ||
          !(claims && typeof claims === 'object' && 'sub' in claims && identity.sub === claims.sub)
        ) {
          return Response.json(
            { error: 'invalid_token' },
            {
              status: 401,
              headers: {
                'cache-control': 'no-store',
                'www-authenticate': 'Bearer error="invalid_token"',
              },
            },
          )
        }
      }
      if (path === '/api/auth/oauth2/token' && response.ok) {
        if (!input) return Response.json({ error: 'invalid_grant' }, { status: 400 })
        const output = tokenResponseSchema.parse(await response.clone().json())
        const credentials = [
          {
            kind: 'access' as const,
            digest: credentialDigest(output.access_token),
            expiresAt: new Date(Date.now() + output.expires_in * 1000),
          },
        ]
        const refresh = output.refresh_token
          ? await store.issuedRefresh(output.refresh_token)
          : null
        if (
          output.refresh_token &&
          (!refresh ||
            refresh.userId !== input.authorization.userId ||
            refresh.clientId !== input.authorization.clientId)
        ) {
          return Response.json({ error: 'invalid_grant' }, { status: 400 })
        }
        await store.bind(input.authorization.id, [
          ...credentials,
          ...(output.refresh_token && refresh
            ? [
                {
                  kind: 'refresh' as const,
                  digest: credentialDigest(output.refresh_token),
                  expiresAt: refresh.expiresAt,
                },
              ]
            : []),
        ])
        if (!(await store.resolve('access', output.access_token))) {
          return Response.json({ error: 'invalid_grant' }, { status: 400 })
        }
      }

      let redirect = response.headers.get('location')
      if (
        !redirect &&
        response.ok &&
        response.headers.get('content-type')?.includes('application/json')
      ) {
        const body = await response.clone().json()
        if (body?.redirect === true && typeof body.url === 'string') redirect = body.url
      }
      const code = redirect
        ? new URL(redirect, env.AUTH_PUBLIC_ORIGIN).searchParams.get('code')
        : null
      if (code && !(await store.resolve('code', code))) {
        return Response.json({ error: 'invalid_grant' }, { status: 403 })
      }
      return response
    } catch {
      return Response.json({ error: 'temporarily_unavailable' }, { status: 503 })
    }
  }
}
