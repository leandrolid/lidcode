CREATE TABLE "shortened_urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_url" text NOT NULL,
	"short_code" text NOT NULL,
	"created_at" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp (3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "shortened_urls_short_code_key" ON "shortened_urls" USING btree ("short_code" text_ops);