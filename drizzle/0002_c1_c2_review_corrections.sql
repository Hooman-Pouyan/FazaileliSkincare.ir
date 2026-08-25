-- Storefront/database review corrections C1 and C2.
-- Statement order is deliberate: the composite foreign key cannot be created
-- until the unique index it references exists. drizzle-kit emitted them the
-- other way round; the order below is the one PostgreSQL accepts.

-- C1 (HIGH-1) — deleting a customer who had ordered aborted here.
-- person_id is ON DELETE SET NULL, so the delete set it to null and this check
-- then failed inside the cascade, surfacing as an opaque constraint error
-- rather than a domain rule. customer_order.contact_phone (added in 0001) is a
-- NOT NULL snapshot taken at placement, so every order already carries its own
-- contact and survives the customer row.
ALTER TABLE "customer_order" DROP CONSTRAINT "customer_order_contact_check";--> statement-breakpoint

-- C2 (HIGH-2) — a settlement could name payment A and order B.
-- The two independent foreign keys are replaced by one composite key, so a
-- settlement can only reference the order its own payment belongs to.
CREATE UNIQUE INDEX "payment_id_order_unique" ON "payment" USING btree ("id","order_id");--> statement-breakpoint
ALTER TABLE "payment_settlement" DROP CONSTRAINT "payment_settlement_payment_id_payment_id_fk";--> statement-breakpoint
ALTER TABLE "payment_settlement" DROP CONSTRAINT "payment_settlement_order_id_customer_order_id_fk";--> statement-breakpoint
ALTER TABLE "payment_settlement" ADD CONSTRAINT "payment_settlement_payment_order_fk" FOREIGN KEY ("payment_id","order_id") REFERENCES "public"."payment"("id","order_id") ON DELETE restrict ON UPDATE no action;
