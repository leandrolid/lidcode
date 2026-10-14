CREATE TABLE "filelid_shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"management_token_hash" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filelid_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"share_id" uuid NOT NULL,
	"pathname" text NOT NULL,
	"name" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"content_type" text NOT NULL,
	CONSTRAINT "filelid_files_pathname_unique" UNIQUE("pathname")
);
--> statement-breakpoint
ALTER TABLE "filelid_files" ADD CONSTRAINT "filelid_files_share_id_filelid_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."filelid_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "filelid_shares_expiration_idx" ON "filelid_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "filelid_files_share_idx" ON "filelid_files" USING btree ("share_id");