ALTER TABLE "shortened_urls" ADD COLUMN "user_id" uuid;--> statement-breakpoint
CREATE INDEX "shortened_urls_user_id_idx" ON "shortened_urls" USING btree ("user_id");