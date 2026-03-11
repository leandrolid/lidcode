import { pgTable, timestamp, text, uniqueIndex, serial, uuid, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const shortenedUrls = pgTable(
  'shortened_urls',
  {
    id: serial().primaryKey().notNull(),
    originalUrl: text('original_url').notNull(),
    shortCode: text('short_code').notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { precision: 3, mode: 'date' }),
    userId: uuid('user_id'),
  },
  (table) => [
    uniqueIndex('shortened_urls_short_code_key').using(
      'btree',
      table.shortCode.asc().nullsLast().op('text_ops'),
    ),
    index('shortened_urls_user_id_idx').on(table.userId),
  ],
)
