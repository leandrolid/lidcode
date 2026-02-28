import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { env } from '@/env'
import { Resend } from 'resend'
import { createSecondaryStorageAdapter } from '@infra/auth/secondary-storage'
import type { RedisStorageService } from '@infra/services/redis-storage.service'

const resend = new Resend(env.RESEND_API_KEY)

export function createAuthInstance(
  db: NodePgDatabase<Record<string, never>>,
  redisStorage: RedisStorageService,
) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db, {
      provider: 'pg',
    }),

    secondaryStorage: createSecondaryStorageAdapter(redisStorage),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60, // 1 hour
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: 'Verify your email',
          html: `
            <p>Hi ${user.name},</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${url}">Verify Email</a>
            <p>This link expires in 1 hour.</p>
          `,
        })
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60, // 60 seconds
        strategy: 'compact',
      },
    },

    advanced: {
      cookieOptions: {
        httpOnly: true,
        secure: env.AUTH_COOKIE_SECURE,
        sameSite: env.AUTH_COOKIE_SAMESITE,
        ...(env.AUTH_COOKIE_DOMAIN && { domain: env.AUTH_COOKIE_DOMAIN }),
      },
      crossSubDomainCookies: env.AUTH_COOKIE_DOMAIN
        ? {
            enabled: true,
            domain: env.AUTH_COOKIE_DOMAIN,
          }
        : undefined,
    },

    socialProviders: {
      ...(env.AUTH_ENABLE_GOOGLE &&
        env.GOOGLE_CLIENT_ID &&
        env.GOOGLE_CLIENT_SECRET && {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }),
      ...(env.AUTH_ENABLE_GITHUB &&
        env.GITHUB_CLIENT_ID &&
        env.GITHUB_CLIENT_SECRET && {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }),
    },

    rateLimit: {
      window: 60, // 1 minute window
      max: 100, // 100 requests per minute globally
      customRules: {
        // Email/password sign-in: 5 attempts per 60 seconds per identifier
        '/sign-in/email': {
          window: 60,
          max: 5,
        },
        // Email/password sign-up: 3 attempts per 300 seconds (5 min) to prevent abuse
        '/sign-up/email': {
          window: 300,
          max: 3,
        },
      },
    },
  })
}
