import { eq } from 'drizzle-orm'
import { APIError } from 'better-auth/api'
import { Hono } from 'hono'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'
import { isAdministrator } from '../../../application/usecases/is-administrator.js'
import type { createDatabase } from '../../adapters/drizzle/client.js'
import { oauthClient, oauthClientResource } from '../../adapters/drizzle/schemas/auth.js'
import { requirePortalSession, type PortalEnv } from '../../adapters/hono/portal-session.js'
import {
  clientApplicationType,
  clientConfigurationSchema,
  clientStatusSchema,
  clientUpdateSchema,
} from './oauth-clients.validation.js'

export function oauthClientRoutes(
  auth: Auth,
  database: ReturnType<typeof createDatabase>['database'],
  env: AuthEnv,
) {
  const routes = new Hono<PortalEnv>()
  const publicFields = {
    clientId: oauthClient.clientId,
    name: oauthClient.name,
    redirectUris: oauthClient.redirectUris,
    scopes: oauthClient.scopes,
    disabled: oauthClient.disabled,
    resource: oauthClientResource.resourceId,
    tokenEndpointAuthMethod: oauthClient.tokenEndpointAuthMethod,
    grantTypes: oauthClient.grantTypes,
    requirePKCE: oauthClient.requirePKCE,
    skipConsent: oauthClient.skipConsent,
  }
  async function findClient(clientId: string) {
    const [client] = await database
      .select(publicFields)
      .from(oauthClient)
      .leftJoin(oauthClientResource, eq(oauthClientResource.clientId, oauthClient.clientId))
      .where(eq(oauthClient.clientId, clientId))
    return client
  }
  routes.use('*', requirePortalSession(auth, env))
  routes.use('*', async (context, next) => {
    if (!(await isAdministrator(database, context.get('user').id)))
      return context.json({ error: 'forbidden' }, 403)
    await next()
  })

  routes.get('/', async (context) => {
    const clients = await database
      .select(publicFields)
      .from(oauthClient)
      .leftJoin(oauthClientResource, eq(oauthClientResource.clientId, oauthClient.clientId))
    return context.json({ clients })
  })

  routes.post('/', async (context) => {
    const input = clientConfigurationSchema.safeParse(await context.req.json().catch(() => null))
    if (!input.success)
      return context.json({ error: 'validation_error', issues: input.error.issues }, 400)
    const headers = context.req.raw.headers
    try {
      const created = await auth.api.adminCreateOAuthClient({
        headers,
        body: {
          client_name: input.data.name,
          redirect_uris: input.data.redirectUris,
          scope: input.data.scopes.join(' '),
          token_endpoint_auth_method: 'client_secret_basic',
          application_type: clientApplicationType(input.data.redirectUris),
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          require_pkce: true,
          skip_consent: false,
        },
      })
      const resource = `${env.issuer}/resources/${created.client_id}`
      await auth.api.adminCreateOAuthResource({
        headers,
        body: {
          identifier: resource,
          name: input.data.name,
          allowedScopes: input.data.scopes,
        },
      })
      await auth.api.adminLinkClientResource({
        headers,
        params: { identifier: resource, client_id: created.client_id },
      })
      return context.json(
        { client: await findClient(created.client_id), clientSecret: created.client_secret },
        201,
      )
    } catch (error) {
      if (error instanceof APIError)
        return context.json({ error: 'invalid_client_metadata', message: error.message }, 400)
      throw error
    }
  })

  routes.patch('/:clientId', async (context) => {
    const input = clientUpdateSchema.safeParse(await context.req.json().catch(() => null))
    if (!input.success)
      return context.json({ error: 'validation_error', issues: input.error.issues }, 400)
    const existing = await findClient(context.req.param('clientId'))
    if (!existing?.resource) return context.json({ error: 'not_found' }, 404)
    const headers = context.req.raw.headers
    try {
      await auth.api.adminUpdateOAuthClient({
        headers,
        body: {
          client_id: existing.clientId,
          update: {
            ...(input.data.name ? { client_name: input.data.name } : {}),
            ...(input.data.scopes ? { scope: input.data.scopes.join(' ') } : {}),
            ...(input.data.redirectUris
              ? {
                  redirect_uris: input.data.redirectUris,
                  application_type: clientApplicationType(input.data.redirectUris),
                }
              : {}),
            skip_consent: false,
            grant_types: ['authorization_code', 'refresh_token'],
          },
        },
      })
      await auth.api.adminUpdateOAuthResource({
        headers,
        params: { identifier: existing.resource },
        body: {
          ...(input.data.name ? { name: input.data.name } : {}),
          ...(input.data.scopes ? { allowedScopes: input.data.scopes } : {}),
        },
      })
      return context.json({ client: await findClient(existing.clientId) })
    } catch (error) {
      if (error instanceof APIError)
        return context.json({ error: 'invalid_client_metadata', message: error.message }, 400)
      throw error
    }
  })

  routes.patch('/:clientId/status', async (context) => {
    const input = clientStatusSchema.safeParse(await context.req.json().catch(() => null))
    if (!input.success)
      return context.json({ error: 'validation_error', issues: input.error.issues }, 400)
    const existing = await findClient(context.req.param('clientId'))
    if (!existing) return context.json({ error: 'not_found' }, 404)
    await auth.api.adminUpdateOAuthClient({
      headers: context.req.raw.headers,
      body: {
        client_id: existing.clientId,
        update: { disabled: !input.data.enabled },
      },
    })
    return context.json({ client: await findClient(existing.clientId) })
  })

  routes.post('/:clientId/rotate-secret', async (context) => {
    if ((await context.req.text()).trim() || Object.keys(context.req.query()).length) {
      return context.json({ error: 'invalid_request' }, 400)
    }
    const existing = await findClient(context.req.param('clientId'))
    if (!existing) return context.json({ error: 'not_found' }, 404)
    const rotated = await auth.api.rotateClientSecret({
      headers: context.req.raw.headers,
      body: { client_id: existing.clientId },
    })
    return context.json({
      client: await findClient(existing.clientId),
      clientSecret: rotated.client_secret,
    })
  })

  return routes
}
