import { sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { oauthClient, user } from './auth.js'

export const appAuthorizations = pgTable(
  'app_authorizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    scopes: text('scopes').array().notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('app_authorizations_active_user_client')
      .on(table.userId, table.clientId)
      .where(sql`${table.revokedAt} IS NULL`),
    index('app_authorizations_user_client').on(table.userId, table.clientId),
  ],
)

export const authorizationBindings = pgTable(
  'authorization_bindings',
  {
    kind: text('kind', { enum: ['code', 'access', 'refresh'] }).notNull(),
    digest: varchar('digest', { length: 64 }).notNull(),
    authorizationId: uuid('authorization_id')
      .notNull()
      .references(() => appAuthorizations.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.kind, table.digest] }),
    index('authorization_bindings_authorization').on(table.authorizationId),
    index('authorization_bindings_expiry').on(table.expiresAt),
  ],
)
