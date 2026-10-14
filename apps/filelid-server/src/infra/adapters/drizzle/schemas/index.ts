import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const fileShares = pgTable(
  'filelid_shares',
  {
    id: uuid('id').primaryKey(),
    managementTokenHash: text('management_token_hash').notNull(),
    status: text('status', { enum: ['uploading', 'ready', 'deleting'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('filelid_shares_expiration_idx').on(table.expiresAt)],
)

export const sharedFiles = pgTable(
  'filelid_files',
  {
    id: uuid('id').primaryKey(),
    shareId: uuid('share_id')
      .notNull()
      .references(() => fileShares.id, { onDelete: 'cascade' }),
    pathname: text('pathname').notNull().unique(),
    name: text('name').notNull(),
    size: integer('size').notNull().default(0),
    contentType: text('content_type').notNull(),
  },
  (table) => [index('filelid_files_share_idx').on(table.shareId)],
)
