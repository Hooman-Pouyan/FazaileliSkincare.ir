ALTER TABLE "inventory_reservation" DROP CONSTRAINT "inventory_reservation_source_cart_item_id_cart_item_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_reservation" ALTER COLUMN "source_cart_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD COLUMN "source_cart_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_source_cart_id_cart_id_fk" FOREIGN KEY ("source_cart_id") REFERENCES "public"."cart"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_source_cart_item_id_cart_item_id_fk" FOREIGN KEY ("source_cart_item_id") REFERENCES "public"."cart_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_reservation_cart_idx" ON "inventory_reservation" USING btree ("source_cart_id");