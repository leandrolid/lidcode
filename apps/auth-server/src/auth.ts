import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { oauthProvider } from '@better-auth/oauth-provider'
import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { jwt } from 'better-auth/plugins'
import { AsyncLocalStorage } from 'node:async_hooks'
import { recordAuthorizationCode } from './application/usecases/record-authorization-code.js'
import { isAdministrator } from './application/usecases/is-administrator.js'
import type { AuthEnv } from './env.js'
import {
  blockedProviderPaths,
  createProtocolHandler,
} from './infra/adapters/better-auth/protocol-handler.js'
import type { createDatabase } from './infra/adapters/drizzle/client.js'
import {
  createAuthorizationStore,
  credentialDigest,
} from './infra/repositories/authorization-store.js'
import { createEmailSender, type SendAccountEmail } from './infra/services/account-email.js'
import { createEmailVerificationStore } from './infra/repositories/email-verification-store.js'

export function createAuth(
  env: AuthEnv,
  database: ReturnType<typeof createDatabase>['database'],
  sendEmail: SendAccountEmail = createEmailSender(env),
) {
  const authorizationStore = createAuthorizationStore(database)
  const emailProofs = createEmailVerificationStore(database)
  const requestContext = new AsyncLocalStorage<{ startedAt: Date; explicitConsent: boolean }>()
  const auth = betterAuth({
    appName: 'Lidcode',
    baseURL: env.issuer,
    basePath: '/api/auth',
    secret: env.AUTH_SECRET,
    trustedOrigins: [env.AUTH_PUBLIC_ORIGIN],
    database: drizzleAdapter(database, { provider: 'pg', transaction: true }),
    disabledPaths: blockedProviderPaths,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: ({ user, url }) =>
        sendEmail({ to: user.email, url, kind: 'password-reset' }),
    },
    emailVerification: {
      expiresIn: 3600,
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        await emailProofs.record(token)
        await sendEmail({ to: user.email, url, kind: 'verification' })
      },
    },
    session: { expiresIn: 7 * 24 * 60 * 60, cookieCache: { enabled: false } },
    user: {
      validateUserInfo: ({ user, source }) => {
        if (source.oauth && (!user.email || !user.emailVerified)) {
          return {
            error: 'verified_email_required',
            errorDescription: 'Use a provider with a verified email address',
          }
        }
      },
      additionalFields: {
        role: { type: ['user', 'admin'], required: true, defaultValue: 'user', input: false },
      },
    },
    socialProviders: {
      ...(env.AUTH_GOOGLE_CLIENT_ID && env.AUTH_GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.AUTH_GOOGLE_CLIENT_ID,
              clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
              requireEmailVerification: true,
              overrideUserInfoOnSignIn: false,
            },
          }
        : {}),
      ...(env.AUTH_GITHUB_CLIENT_ID && env.AUTH_GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: env.AUTH_GITHUB_CLIENT_ID,
              clientSecret: env.AUTH_GITHUB_CLIENT_SECRET,
              requireEmailVerification: true,
              overrideUserInfoOnSignIn: false,
            },
          }
        : {}),
    },
    account: {
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: false,
        updateUserInfoOnLink: false,
        allowUnlinkingAll: false,
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ['x-lidcode-peer-ip'] },
      useSecureCookies: env.NODE_ENV === 'production',
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
    },
    rateLimit: { enabled: true, storage: 'database' },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== '/verify-email') return
        const token = context.query?.token
        if (typeof token !== 'string' || !(await emailProofs.consume(token))) {
          throw new APIError('BAD_REQUEST', {
            code: 'INVALID_TOKEN',
            message: 'Verification link is expired or already used',
          })
        }
      }),
    },
    databaseHooks: {
      verification: {
        create: {
          before: async (verification) => {
            const context = requestContext.getStore()
            await recordAuthorizationCode(
              authorizationStore,
              verification,
              context?.explicitConsent ?? false,
              context?.startedAt,
            )
          },
        },
      },
    },
    plugins: [
      jwt(),
      oauthProvider({
        loginPage: '/login',
        consentPage: '/consent',
        scopes: ['openid', 'profile', 'email', 'offline_access'],
        grantTypes: ['authorization_code', 'refresh_token'],
        codeExpiresIn: 300,
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 30 * 24 * 60 * 60,
        refreshTokenReuseInterval: 0,
        storeTokens: { hash: credentialDigest },
        allowDynamicClientRegistration: false,
        allowUnauthenticatedClientRegistration: false,
        clientRegistrationRequirePKCE: true,
        enforcePerClientResources: true,
        validateRedirectUri: (uri, registered) => registered.includes(uri),
        clientPrivileges: ({ user }) => isAdministrator(database, user?.id),
        clientReference: () => 'lidcode',
        resourcePrivileges: ({ user }) => isAdministrator(database, user?.id),
      }),
    ],
  })

  const protocolHandler = createProtocolHandler(auth.handler, authorizationStore, env)
  auth.handler = (request: Request) =>
    requestContext.run(
      {
        startedAt: new Date(),
        explicitConsent: new URL(request.url).pathname === '/api/auth/oauth2/consent',
      },
      () => protocolHandler(request),
    )
  auth.fetch = auth.handler
  return auth
}

export type Auth = ReturnType<typeof createAuth>
