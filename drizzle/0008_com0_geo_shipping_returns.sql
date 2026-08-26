CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."return_disposition" AS ENUM('pending', 'restock', 'discard', 'quarantine');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('requested', 'approved', 'rejected', 'received', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TABLE "order_access_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iran_city" (
	"code" text PRIMARY KEY NOT NULL,
	"province_code" text NOT NULL,
	"name_fa" text NOT NULL,
	"name_en" text NOT NULL,
	"is_capital" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iran_province" (
	"code" text PRIMARY KEY NOT NULL,
	"name_fa" text NOT NULL,
	"name_en" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" "shipping_method" NOT NULL,
	"province_code" text,
	"city_code" text,
	"amount_rials" bigint NOT NULL,
	"label_fa" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_rate_amount_check" CHECK ("shipping_rate"."amount_rials" >= 0),
	CONSTRAINT "shipping_rate_scope_check" CHECK ("shipping_rate"."city_code" is null or "shipping_rate"."province_code" is not null)
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"return_request_id" uuid,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount_rials" bigint NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"provider_reference" text,
	"failure_reason" text,
	"processed_by" uuid,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_amount_check" CHECK ("refund"."amount_rials" > 0),
	CONSTRAINT "refund_completed_check" CHECK ("refund"."status" <> 'completed' or "refund"."completed_at" is not null),
	CONSTRAINT "refund_failed_check" CHECK ("refund"."status" <> 'failed' or ("refund"."failed_at" is not null and "refund"."failure_reason" is not null)),
	CONSTRAINT "refund_terminal_check" CHECK ("refund"."completed_at" is null or "refund"."failed_at" is null)
);
--> statement-breakpoint
CREATE TABLE "return_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_request_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"quantity_requested" integer NOT NULL,
	"quantity_received" integer,
	"disposition" "return_disposition" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_line_requested_check" CHECK ("return_line"."quantity_requested" > 0),
	CONSTRAINT "return_line_received_check" CHECK ("return_line"."quantity_received" is null or ("return_line"."quantity_received" >= 0 and "return_line"."quantity_received" <= "return_line"."quantity_requested")),
	CONSTRAINT "return_line_disposition_check" CHECK ("return_line"."disposition" = 'pending' or "return_line"."quantity_received" is not null)
);
--> statement-breakpoint
CREATE TABLE "return_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"person_id" uuid,
	"status" "return_status" DEFAULT 'requested' NOT NULL,
	"reason" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"received_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_request_review_check" CHECK (("return_request"."reviewed_by" is null) = ("return_request"."reviewed_at" is null)),
	CONSTRAINT "return_request_approved_review_check" CHECK ("return_request"."status" not in ('approved', 'rejected') or "return_request"."reviewed_at" is not null),
	CONSTRAINT "return_request_received_check" CHECK ("return_request"."status" <> 'received' or "return_request"."received_at" is not null),
	CONSTRAINT "return_request_resolved_check" CHECK ("return_request"."status" <> 'resolved' or "return_request"."resolved_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "shipment_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "shipment_line_quantity_check" CHECK ("shipment_line"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "order_access_token" ADD CONSTRAINT "order_access_token_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iran_city" ADD CONSTRAINT "iran_city_province_code_iran_province_code_fk" FOREIGN KEY ("province_code") REFERENCES "public"."iran_province"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rate" ADD CONSTRAINT "shipping_rate_province_code_iran_province_code_fk" FOREIGN KEY ("province_code") REFERENCES "public"."iran_province"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rate" ADD CONSTRAINT "shipping_rate_city_code_iran_city_code_fk" FOREIGN KEY ("city_code") REFERENCES "public"."iran_city"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_return_request_id_return_request_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_request"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_processed_by_person_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_order_fk" FOREIGN KEY ("payment_id","order_id") REFERENCES "public"."payment"("id","order_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_line" ADD CONSTRAINT "return_line_return_request_id_return_request_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_line" ADD CONSTRAINT "return_line_order_line_id_order_line_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_line"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_reviewed_by_person_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_line" ADD CONSTRAINT "shipment_line_shipment_id_shipment_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_line" ADD CONSTRAINT "shipment_line_order_line_id_order_line_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_line"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_access_token_hash_unique" ON "order_access_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "order_access_token_order_idx" ON "order_access_token" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_access_token_live_idx" ON "order_access_token" USING btree ("order_id","expires_at") WHERE "order_access_token"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "iran_city_province_name_unique" ON "iran_city" USING btree ("province_code","name_fa");--> statement-breakpoint
CREATE INDEX "iran_city_province_idx" ON "iran_city" USING btree ("province_code","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "iran_province_name_fa_unique" ON "iran_province" USING btree ("name_fa");--> statement-breakpoint
CREATE INDEX "iran_province_sort_idx" ON "iran_province" USING btree ("sort_order","code");--> statement-breakpoint
CREATE INDEX "shipping_rate_lookup_idx" ON "shipping_rate" USING btree ("method","province_code","city_code") WHERE "shipping_rate"."is_active";--> statement-breakpoint
CREATE INDEX "shipping_rate_province_idx" ON "shipping_rate" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "shipping_rate_city_idx" ON "shipping_rate" USING btree ("city_code");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_rate_national_unique" ON "shipping_rate" USING btree ("method") WHERE "shipping_rate"."is_active" and "shipping_rate"."province_code" is null and "shipping_rate"."city_code" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_rate_province_unique" ON "shipping_rate" USING btree ("method","province_code") WHERE "shipping_rate"."is_active" and "shipping_rate"."province_code" is not null and "shipping_rate"."city_code" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_rate_city_unique" ON "shipping_rate" USING btree ("method","city_code") WHERE "shipping_rate"."is_active" and "shipping_rate"."city_code" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "refund_idempotency_unique" ON "refund" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "refund_provider_reference_unique" ON "refund" USING btree ("provider_reference") WHERE "refund"."provider_reference" is not null;--> statement-breakpoint
CREATE INDEX "refund_payment_order_idx" ON "refund" USING btree ("payment_id","order_id");--> statement-breakpoint
CREATE INDEX "refund_order_idx" ON "refund" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refund_return_idx" ON "refund" USING btree ("return_request_id");--> statement-breakpoint
CREATE INDEX "refund_processor_idx" ON "refund" USING btree ("processed_by");--> statement-breakpoint
CREATE INDEX "refund_status_time_idx" ON "refund" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "return_line_request_order_line_unique" ON "return_line" USING btree ("return_request_id","order_line_id");--> statement-breakpoint
CREATE INDEX "return_line_order_line_idx" ON "return_line" USING btree ("order_line_id");--> statement-breakpoint
CREATE UNIQUE INDEX "return_request_idempotency_unique" ON "return_request" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "return_request_order_idx" ON "return_request" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_request_person_idx" ON "return_request" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "return_request_reviewer_idx" ON "return_request" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "return_request_status_time_idx" ON "return_request" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipment_line_shipment_order_line_unique" ON "shipment_line" USING btree ("shipment_id","order_line_id");--> statement-breakpoint
CREATE INDEX "shipment_line_order_line_idx" ON "shipment_line" USING btree ("order_line_id");