CREATE TYPE "public"."pair_source" AS ENUM('development', 'owner');--> statement-breakpoint
CREATE TABLE "product_pair" (
	"product_id" uuid NOT NULL,
	"paired_product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source" "pair_source" DEFAULT 'development' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_pair_product_id_paired_product_id_pk" PRIMARY KEY("product_id","paired_product_id"),
	CONSTRAINT "product_pair_not_self_check" CHECK ("product_pair"."product_id" <> "product_pair"."paired_product_id"),
	CONSTRAINT "product_pair_sort_order_check" CHECK ("product_pair"."sort_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_pair" ADD CONSTRAINT "product_pair_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_pair" ADD CONSTRAINT "product_pair_paired_product_id_product_id_fk" FOREIGN KEY ("paired_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_pair_paired_idx" ON "product_pair" USING btree ("paired_product_id");--> statement-breakpoint
CREATE INDEX "product_pair_order_idx" ON "product_pair" USING btree ("product_id","sort_order");