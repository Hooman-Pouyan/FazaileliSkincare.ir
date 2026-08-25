CREATE TABLE "auth_two_factor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"person_id" uuid NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"failed_verification_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "auth_two_factor_failed_count_check" CHECK ("auth_two_factor"."failed_verification_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "person" DROP CONSTRAINT "person_placeholder_email_check";--> statement-breakpoint
DROP INDEX "auth_account_provider_account_unique";--> statement-breakpoint
ALTER TABLE "auth_account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "auth_account"
SET "issuer" = CASE
  WHEN "provider_id" = 'credential' THEN 'local:credential'
  ELSE "provider_id"
END
WHERE "issuer" IS NULL;--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer_order" ADD COLUMN "contact_phone" text;--> statement-breakpoint
UPDATE "customer_order"
SET "contact_phone" = "guest_phone"
WHERE "contact_phone" IS NULL AND "guest_phone" IS NOT NULL;--> statement-breakpoint
UPDATE "customer_order" AS "orders"
SET "contact_phone" = "people"."phone"
FROM "person" AS "people"
WHERE "orders"."contact_phone" IS NULL
  AND "orders"."person_id" = "people"."id"
  AND "people"."phone" IS NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "customer_order" WHERE "contact_phone" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill customer_order.contact_phone from guest_phone or person.phone';
  END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "customer_order" ALTER COLUMN "contact_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_two_factor" ADD CONSTRAINT "auth_two_factor_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_two_factor_secret_idx" ON "auth_two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "auth_two_factor_person_idx" ON "auth_two_factor" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_issuer_account_unique" ON "auth_account" USING btree ("issuer","account_id");--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_phone_e164_check" CHECK ("person"."phone" is null or "person"."phone" ~ '^\+[1-9][0-9]{7,14}$');--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_closed_account_check" CHECK ("person"."closed_at" is null or ("person"."phone" is null and not "person"."phone_verified" and not "person"."email_verified" and "person"."email_is_placeholder"));--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_placeholder_email_check" CHECK (not "person"."email_is_placeholder" or (not "person"."email_verified" and lower("person"."email") ~ '^[^@]+@[^@]+\.invalid$'));--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_contact_phone_e164_check" CHECK ("customer_order"."contact_phone" ~ '^\+[1-9][0-9]{7,14}$');
