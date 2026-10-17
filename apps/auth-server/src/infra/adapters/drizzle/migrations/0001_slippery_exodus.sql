CREATE TABLE "app_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"scopes" text[] NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "authorization_bindings" (
	"kind" text NOT NULL,
	"digest" varchar(64) NOT NULL,
	"authorization_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "authorization_bindings_kind_digest_pk" PRIMARY KEY("kind","digest")
);
--> statement-breakpoint
ALTER TABLE "app_authorizations" ADD CONSTRAINT "app_authorizations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_authorizations" ADD CONSTRAINT "app_authorizations_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authorization_bindings" ADD CONSTRAINT "authorization_bindings_authorization_id_app_authorizations_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "public"."app_authorizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_authorizations_active_user_client" ON "app_authorizations" USING btree ("user_id","client_id") WHERE "app_authorizations"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "app_authorizations_user_client" ON "app_authorizations" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE INDEX "authorization_bindings_authorization" ON "authorization_bindings" USING btree ("authorization_id");--> statement-breakpoint
CREATE INDEX "authorization_bindings_expiry" ON "authorization_bindings" USING btree ("expires_at");