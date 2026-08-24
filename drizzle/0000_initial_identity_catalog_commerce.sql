CREATE TYPE "public"."bank_transfer_claim_status" AS ENUM('submitted', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'converted', 'expired', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."customer_group" AS ENUM('public', 'student', 'professional');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('initial_load', 'receipt', 'manual_adjustment', 'sale', 'return', 'refund_restock', 'damage', 'correction');--> statement-breakpoint
CREATE TYPE "public"."media_provenance" AS ENUM('supplier_draft', 'brand_owned');--> statement-breakpoint
CREATE TYPE "public"."media_rights" AS ENUM('unknown', 'approved_supplier', 'brand_owned');--> statement-breakpoint
CREATE TYPE "public"."media_role" AS ENUM('primary', 'gallery', 'package', 'texture', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'awaiting_payment', 'awaiting_transfer', 'payment_review', 'paid', 'fulfilled', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'sent', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('gateway', 'bank_transfer', 'cash_on_pickup');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'submitted', 'funds_received', 'settlement_review', 'settled', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."price_batch_status" AS ENUM('draft', 'committed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."price_visibility" AS ENUM('public', 'on_request');--> statement-breakpoint
CREATE TYPE "public"."product_review_state" AS ENUM('draft', 'verified', 'approved');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'consumed', 'released', 'expired');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'student', 'practitioner', 'staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'ready', 'shipped', 'delivered', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipping_method" AS ENUM('post', 'courier', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."size_unit" AS ENUM('ml', 'g', 'unit', 'sheet', 'capsule', 'kit', 'pair');--> statement-breakpoint
CREATE TYPE "public"."text_direction" AS ENUM('rtl', 'ltr');--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_phone" text NOT NULL,
	"province" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"line" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "address_postal_code_check" CHECK ("address"."postal_code" ~ '^[0-9]{10}$')
);
--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"person_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "auth_rate_limit_count_check" CHECK ("auth_rate_limit"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"person_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locale" (
	"code" text PRIMARY KEY NOT NULL,
	"direction" text_direction NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_is_placeholder" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"first_name" text,
	"last_name" text,
	"preferred_locale_code" text DEFAULT 'fa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "person_verified_phone_check" CHECK (not "person"."phone_verified" or "person"."phone" is not null),
	CONSTRAINT "person_placeholder_email_check" CHECK (not "person"."email_is_placeholder" or not "person"."email_verified")
);
--> statement-breakpoint
CREATE TABLE "person_role" (
	"person_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	CONSTRAINT "person_role_person_id_role_pk" PRIMARY KEY("person_id","role")
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"country_code" text,
	"is_official_representative" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_country_code_check" CHECK ("brand"."country_code" is null or "brand"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "brand_translation" (
	"brand_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	CONSTRAINT "brand_translation_brand_id_locale_code_pk" PRIMARY KEY("brand_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_parent_check" CHECK ("category"."parent_id" is null or "category"."parent_id" <> "category"."id")
);
--> statement-breakpoint
CREATE TABLE "category_translation" (
	"category_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"normalized_name" text NOT NULL,
	CONSTRAINT "category_translation_category_id_locale_code_pk" PRIMARY KEY("category_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "concern" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concern_translation" (
	"concern_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"normalized_name" text NOT NULL,
	CONSTRAINT "concern_translation_concern_id_locale_code_pk" PRIMARY KEY("concern_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "product_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_line_translation" (
	"product_line_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	CONSTRAINT "product_line_translation_product_line_id_locale_code_pk" PRIMARY KEY("product_line_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "protocol" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_phase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_phase_translation" (
	"protocol_phase_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"normalized_name" text NOT NULL,
	CONSTRAINT "protocol_phase_translation_protocol_phase_id_locale_code_pk" PRIMARY KEY("protocol_phase_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "protocol_translation" (
	"protocol_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"normalized_name" text NOT NULL,
	CONSTRAINT "protocol_translation_protocol_id_locale_code_pk" PRIMARY KEY("protocol_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "skin_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skin_state_translation" (
	"skin_state_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"normalized_name" text NOT NULL,
	CONSTRAINT "skin_state_translation_skin_state_id_locale_code_pk" PRIMARY KEY("skin_state_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"line_id" uuid,
	"category_id" uuid,
	"irc_code" text,
	"is_professional_only" boolean DEFAULT false NOT NULL,
	"price_visibility" "price_visibility" DEFAULT 'public' NOT NULL,
	"review_state" "product_review_state" DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"merchandising_rank" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_published_state_check" CHECK (not "product"."is_published" or ("product"."review_state" = 'approved' and "product"."published_at" is not null)),
	CONSTRAINT "product_version_check" CHECK ("product"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_concern" (
	"product_id" uuid NOT NULL,
	"concern_id" uuid NOT NULL,
	CONSTRAINT "product_concern_product_id_concern_id_pk" PRIMARY KEY("product_id","concern_id")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"role" "media_role" DEFAULT 'unknown' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"source_path" text NOT NULL,
	"source_filename" text NOT NULL,
	"checksum_sha256" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"original_object_key" text,
	"card_object_key" text,
	"detail_object_key" text,
	"provenance" "media_provenance" NOT NULL,
	"rights" "media_rights" DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_media_checksum_check" CHECK ("product_media"."checksum_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "product_media_dimensions_check" CHECK ("product_media"."width" > 0 and "product_media"."height" > 0 and "product_media"."byte_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_media_translation" (
	"product_media_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"alt_text" text NOT NULL,
	CONSTRAINT "product_media_translation_product_media_id_locale_code_pk" PRIMARY KEY("product_media_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "product_protocol_phase" (
	"product_id" uuid NOT NULL,
	"protocol_phase_id" uuid NOT NULL,
	CONSTRAINT "product_protocol_phase_product_id_protocol_phase_id_pk" PRIMARY KEY("product_id","protocol_phase_id")
);
--> statement-breakpoint
CREATE TABLE "product_skin_state" (
	"product_id" uuid NOT NULL,
	"skin_state_id" uuid NOT NULL,
	CONSTRAINT "product_skin_state_product_id_skin_state_id_pk" PRIMARY KEY("product_id","skin_state_id")
);
--> statement-breakpoint
CREATE TABLE "product_translation" (
	"product_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"name" text NOT NULL,
	"promise" text,
	"description" text,
	"ingredients" text,
	"usage" text,
	"suitable_for" text,
	"normalized_search_text" text NOT NULL,
	CONSTRAINT "product_translation_product_id_locale_code_pk" PRIMARY KEY("product_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"barcode" text,
	"size_value" numeric(10, 2),
	"size_unit" "size_unit",
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "variant_size_check" CHECK (("variant"."size_value" is null and "variant"."size_unit" is null) or ("variant"."size_value" > 0 and "variant"."size_unit" is not null))
);
--> statement-breakpoint
CREATE TABLE "variant_translation" (
	"variant_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"display_name" text,
	"size_label" text,
	CONSTRAINT "variant_translation_variant_id_locale_code_pk" PRIMARY KEY("variant_id","locale_code")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_on_hand_check" CHECK ("inventory"."on_hand" >= 0),
	CONSTRAINT "inventory_version_check" CHECK ("inventory"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"type" "inventory_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"resulting_on_hand" integer NOT NULL,
	"related_aggregate_type" text,
	"related_aggregate_id" uuid,
	"actor_id" uuid,
	"reason" text,
	"idempotency_key" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movement_delta_check" CHECK ("inventory_movement"."quantity_delta" <> 0),
	CONSTRAINT "inventory_movement_result_check" CHECK ("inventory_movement"."resulting_on_hand" >= 0),
	CONSTRAINT "inventory_movement_aggregate_check" CHECK (("inventory_movement"."related_aggregate_type" is null) = ("inventory_movement"."related_aggregate_id" is null))
);
--> statement-breakpoint
CREATE TABLE "price" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"customer_group" "customer_group" DEFAULT 'public' NOT NULL,
	"amount_rials" bigint NOT NULL,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_amount_check" CHECK ("price"."amount_rials" >= 0)
);
--> statement-breakpoint
CREATE TABLE "price_adjustment_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"status" "price_batch_status" DEFAULT 'draft' NOT NULL,
	"request_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"committed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone,
	CONSTRAINT "price_adjustment_batch_commit_check" CHECK (("price_adjustment_batch"."status" = 'committed') = ("price_adjustment_batch"."committed_by" is not null and "price_adjustment_batch"."committed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"customer_group" "customer_group" NOT NULL,
	"old_amount_rials" bigint,
	"new_amount_rials" bigint NOT NULL,
	"changed_by" uuid NOT NULL,
	"batch_id" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_history_amount_check" CHECK (("price_history"."old_amount_rials" is null or "price_history"."old_amount_rials" >= 0) and "price_history"."new_amount_rials" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid,
	"anonymous_key_hash" text,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_owner_check" CHECK (("cart"."person_id" is null) <> ("cart"."anonymous_key_hash" is null)),
	CONSTRAINT "cart_version_check" CHECK ("cart"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_item_quantity_check" CHECK ("cart_item"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "customer_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"person_id" uuid,
	"guest_phone" text,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"subtotal_rials" bigint DEFAULT 0 NOT NULL,
	"shipping_rials" bigint DEFAULT 0 NOT NULL,
	"discount_rials" bigint DEFAULT 0 NOT NULL,
	"total_rials" bigint DEFAULT 0 NOT NULL,
	"shipping_method" "shipping_method",
	"address_snapshot" jsonb,
	"checkout_idempotency_key" uuid NOT NULL,
	"checkout_request_hash" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"placed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_order_contact_check" CHECK ("customer_order"."person_id" is not null or "customer_order"."guest_phone" is not null),
	CONSTRAINT "customer_order_totals_check" CHECK ("customer_order"."subtotal_rials" >= 0 and "customer_order"."shipping_rials" >= 0 and "customer_order"."discount_rials" >= 0 and "customer_order"."total_rials" = "customer_order"."subtotal_rials" + "customer_order"."shipping_rials" - "customer_order"."discount_rials"),
	CONSTRAINT "customer_order_discount_check" CHECK ("customer_order"."discount_rials" <= "customer_order"."subtotal_rials" + "customer_order"."shipping_rials"),
	CONSTRAINT "customer_order_version_check" CHECK ("customer_order"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"variant_name_snapshot" text,
	"sku_snapshot" text NOT NULL,
	"unit_price_rials" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_rials" bigint NOT NULL,
	CONSTRAINT "order_line_quantity_check" CHECK ("order_line"."quantity" > 0),
	CONSTRAINT "order_line_price_check" CHECK ("order_line"."unit_price_rials" >= 0),
	CONSTRAINT "order_line_total_check" CHECK ("order_line"."line_total_rials" = "order_line"."unit_price_rials" * "order_line"."quantity")
);
--> statement-breakpoint
CREATE TABLE "bank_transfer_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"status" "bank_transfer_claim_status" DEFAULT 'submitted' NOT NULL,
	"expected_amount_rials" bigint NOT NULL,
	"tracking_number" text,
	"last4_of_card" text,
	"transferred_at" timestamp with time zone,
	"receipt_object_key" text,
	"submission_idempotency_key" uuid NOT NULL,
	"submission_request_hash" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_transfer_claim_amount_check" CHECK ("bank_transfer_claim"."expected_amount_rials" >= 0),
	CONSTRAINT "bank_transfer_claim_last4_check" CHECK ("bank_transfer_claim"."last4_of_card" is null or "bank_transfer_claim"."last4_of_card" ~ '^[0-9]{4}$'),
	CONSTRAINT "bank_transfer_claim_review_check" CHECK (("bank_transfer_claim"."status" = 'submitted' and "bank_transfer_claim"."reviewed_by" is null and "bank_transfer_claim"."reviewed_at" is null) or ("bank_transfer_claim"."status" in ('accepted', 'rejected') and "bank_transfer_claim"."reviewed_by" is not null and "bank_transfer_claim"."reviewed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount_rials" bigint NOT NULL,
	"provider" text,
	"provider_authority" text,
	"provider_reference" text,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"funds_received_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_amount_check" CHECK ("payment"."amount_rials" >= 0),
	CONSTRAINT "payment_version_check" CHECK ("payment"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"provider_event_id" text,
	"actor_id" uuid,
	"payload" jsonb,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_settlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"amount_rials" bigint NOT NULL,
	"actor_id" uuid,
	"idempotency_key" uuid NOT NULL,
	"settled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_settlement_amount_check" CHECK ("payment_settlement"."amount_rials" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"method" "shipping_method" NOT NULL,
	"carrier" text,
	"tracking_code" text,
	"ready_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"source_cart_item_id" uuid NOT NULL,
	"order_line_id" uuid,
	"quantity" integer NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"idempotency_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_reservation_quantity_check" CHECK ("inventory_reservation"."quantity" > 0),
	CONSTRAINT "inventory_reservation_resolution_check" CHECK (("inventory_reservation"."status" = 'active' and "inventory_reservation"."consumed_at" is null and "inventory_reservation"."released_at" is null) or ("inventory_reservation"."status" = 'consumed' and "inventory_reservation"."consumed_at" is not null and "inventory_reservation"."released_at" is null) or ("inventory_reservation"."status" in ('released', 'expired') and "inventory_reservation"."released_at" is not null and "inventory_reservation"."consumed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"request_id" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"deduplication_key" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_outbox_attempts_check" CHECK ("notification_outbox"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_preferred_locale_code_locale_code_fk" FOREIGN KEY ("preferred_locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_role" ADD CONSTRAINT "person_role_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_translation" ADD CONSTRAINT "brand_translation_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_translation" ADD CONSTRAINT "brand_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translation" ADD CONSTRAINT "category_translation_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translation" ADD CONSTRAINT "category_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concern_translation" ADD CONSTRAINT "concern_translation_concern_id_concern_id_fk" FOREIGN KEY ("concern_id") REFERENCES "public"."concern"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concern_translation" ADD CONSTRAINT "concern_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_line" ADD CONSTRAINT "product_line_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_line_translation" ADD CONSTRAINT "product_line_translation_product_line_id_product_line_id_fk" FOREIGN KEY ("product_line_id") REFERENCES "public"."product_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_line_translation" ADD CONSTRAINT "product_line_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_phase" ADD CONSTRAINT "protocol_phase_protocol_id_protocol_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_phase_translation" ADD CONSTRAINT "protocol_phase_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_phase_translation" ADD CONSTRAINT "protocol_phase_translation_phase_fk" FOREIGN KEY ("protocol_phase_id") REFERENCES "public"."protocol_phase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_translation" ADD CONSTRAINT "protocol_translation_protocol_id_protocol_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_translation" ADD CONSTRAINT "protocol_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_state_translation" ADD CONSTRAINT "skin_state_translation_skin_state_id_skin_state_id_fk" FOREIGN KEY ("skin_state_id") REFERENCES "public"."skin_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_state_translation" ADD CONSTRAINT "skin_state_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_line_id_product_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."product_line"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_concern" ADD CONSTRAINT "product_concern_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_concern" ADD CONSTRAINT "product_concern_concern_id_concern_id_fk" FOREIGN KEY ("concern_id") REFERENCES "public"."concern"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media_translation" ADD CONSTRAINT "product_media_translation_product_media_id_product_media_id_fk" FOREIGN KEY ("product_media_id") REFERENCES "public"."product_media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media_translation" ADD CONSTRAINT "product_media_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_protocol_phase" ADD CONSTRAINT "product_protocol_phase_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_protocol_phase" ADD CONSTRAINT "product_protocol_phase_protocol_phase_id_protocol_phase_id_fk" FOREIGN KEY ("protocol_phase_id") REFERENCES "public"."protocol_phase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skin_state" ADD CONSTRAINT "product_skin_state_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skin_state" ADD CONSTRAINT "product_skin_state_skin_state_id_skin_state_id_fk" FOREIGN KEY ("skin_state_id") REFERENCES "public"."skin_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_translation" ADD CONSTRAINT "variant_translation_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_translation" ADD CONSTRAINT "variant_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_actor_id_person_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price" ADD CONSTRAINT "price_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_adjustment_batch" ADD CONSTRAINT "price_adjustment_batch_created_by_person_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_adjustment_batch" ADD CONSTRAINT "price_adjustment_batch_committed_by_person_id_fk" FOREIGN KEY ("committed_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_changed_by_person_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_batch_id_price_adjustment_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."price_adjustment_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transfer_claim" ADD CONSTRAINT "bank_transfer_claim_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transfer_claim" ADD CONSTRAINT "bank_transfer_claim_reviewed_by_person_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_actor_id_person_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_settlement" ADD CONSTRAINT "payment_settlement_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_settlement" ADD CONSTRAINT "payment_settlement_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_settlement" ADD CONSTRAINT "payment_settlement_actor_id_person_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."person"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_order_id_customer_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_variant_id_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_source_cart_item_id_cart_item_id_fk" FOREIGN KEY ("source_cart_item_id") REFERENCES "public"."cart_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_order_line_id_order_line_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_line"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_person_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."person"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_person_idx" ON "address" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "address_person_default_unique" ON "address" USING btree ("person_id") WHERE "address"."is_default";--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_unique" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_account_person_idx" ON "auth_account" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_rate_limit_key_unique" ON "auth_rate_limit" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_session_token_unique" ON "auth_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "auth_session_person_idx" ON "auth_session" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "auth_session_expiry_idx" ON "auth_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "locale_one_primary_unique" ON "locale" USING btree ("is_primary") WHERE "locale"."is_primary";--> statement-breakpoint
CREATE UNIQUE INDEX "person_email_unique" ON "person" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "person_phone_unique" ON "person" USING btree ("phone") WHERE "person"."phone" is not null;--> statement-breakpoint
CREATE INDEX "person_preferred_locale_idx" ON "person" USING btree ("preferred_locale_code");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_slug_unique" ON "brand" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "brand_translation_name_idx" ON "brand_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_unique" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_translation_name_idx" ON "category_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "concern_slug_unique" ON "concern" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "concern_translation_name_idx" ON "concern_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_line_brand_slug_unique" ON "product_line" USING btree ("brand_id","slug");--> statement-breakpoint
CREATE INDEX "product_line_brand_idx" ON "product_line" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_line_translation_name_idx" ON "product_line_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_slug_unique" ON "protocol" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_phase_protocol_slug_unique" ON "protocol_phase" USING btree ("protocol_id","slug");--> statement-breakpoint
CREATE INDEX "protocol_phase_protocol_idx" ON "protocol_phase" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocol_phase_translation_name_idx" ON "protocol_phase_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE INDEX "protocol_translation_name_idx" ON "protocol_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "skin_state_slug_unique" ON "skin_state" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skin_state_translation_name_idx" ON "skin_state_translation" USING btree ("locale_code","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_unique" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_brand_idx" ON "product" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_line_idx" ON "product" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_public_catalog_idx" ON "product" USING btree ("merchandising_rank","id") WHERE "product"."is_published" and "product"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "product_concern_concern_idx" ON "product_concern" USING btree ("concern_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_source_path_unique" ON "product_media" USING btree ("source_path");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_primary_unique" ON "product_media" USING btree ("product_id") WHERE "product_media"."role" = 'primary';--> statement-breakpoint
CREATE INDEX "product_media_product_sort_idx" ON "product_media" USING btree ("product_id","sort_order","id");--> statement-breakpoint
CREATE INDEX "product_media_checksum_idx" ON "product_media" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE INDEX "product_protocol_phase_phase_idx" ON "product_protocol_phase" USING btree ("protocol_phase_id","product_id");--> statement-breakpoint
CREATE INDEX "product_skin_state_state_idx" ON "product_skin_state" USING btree ("skin_state_id","product_id");--> statement-breakpoint
CREATE INDEX "product_translation_search_idx" ON "product_translation" USING btree ("locale_code","normalized_search_text");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_sku_unique" ON "variant" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_barcode_unique" ON "variant" USING btree ("barcode") WHERE "variant"."barcode" is not null;--> statement-breakpoint
CREATE INDEX "variant_product_active_idx" ON "variant" USING btree ("product_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_movement_idempotency_unique" ON "inventory_movement" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "inventory_movement_variant_time_idx" ON "inventory_movement" USING btree ("variant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "inventory_movement_aggregate_idx" ON "inventory_movement" USING btree ("related_aggregate_type","related_aggregate_id");--> statement-breakpoint
CREATE INDEX "inventory_movement_actor_idx" ON "inventory_movement" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_variant_group_unique" ON "price" USING btree ("variant_id","customer_group");--> statement-breakpoint
CREATE UNIQUE INDEX "price_adjustment_batch_request_hash_unique" ON "price_adjustment_batch" USING btree ("request_hash");--> statement-breakpoint
CREATE INDEX "price_adjustment_batch_created_by_idx" ON "price_adjustment_batch" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "price_adjustment_batch_committed_by_idx" ON "price_adjustment_batch" USING btree ("committed_by");--> statement-breakpoint
CREATE INDEX "price_history_variant_changed_idx" ON "price_history" USING btree ("variant_id","changed_at");--> statement-breakpoint
CREATE INDEX "price_history_batch_idx" ON "price_history" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "price_history_changed_by_idx" ON "price_history" USING btree ("changed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_active_person_unique" ON "cart" USING btree ("person_id") WHERE "cart"."status" = 'active' and "cart"."person_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_active_anonymous_unique" ON "cart" USING btree ("anonymous_key_hash") WHERE "cart"."status" = 'active' and "cart"."anonymous_key_hash" is not null;--> statement-breakpoint
CREATE INDEX "cart_expiry_idx" ON "cart" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_variant_unique" ON "cart_item" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_item_variant_idx" ON "cart_item" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_order_number_unique" ON "customer_order" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_order_checkout_idempotency_unique" ON "customer_order" USING btree ("checkout_idempotency_key");--> statement-breakpoint
CREATE INDEX "customer_order_person_time_idx" ON "customer_order" USING btree ("person_id","created_at","id");--> statement-breakpoint
CREATE INDEX "customer_order_status_time_idx" ON "customer_order" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "order_line_order_idx" ON "order_line" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_line_variant_idx" ON "order_line" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transfer_claim_submission_unique" ON "bank_transfer_claim" USING btree ("submission_idempotency_key");--> statement-breakpoint
CREATE INDEX "bank_transfer_claim_payment_time_idx" ON "bank_transfer_claim" USING btree ("payment_id","created_at");--> statement-breakpoint
CREATE INDEX "bank_transfer_claim_status_time_idx" ON "bank_transfer_claim" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "bank_transfer_claim_reviewer_idx" ON "bank_transfer_claim" USING btree ("reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_idempotency_unique" ON "payment" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_authority_unique" ON "payment" USING btree ("provider","provider_authority") WHERE "payment"."provider" is not null and "payment"."provider_authority" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_reference_unique" ON "payment" USING btree ("provider","provider_reference") WHERE "payment"."provider" is not null and "payment"."provider_reference" is not null;--> statement-breakpoint
CREATE INDEX "payment_order_time_idx" ON "payment" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_status_time_idx" ON "payment" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_event_provider_event_unique" ON "payment_event" USING btree ("provider_event_id") WHERE "payment_event"."provider_event_id" is not null;--> statement-breakpoint
CREATE INDEX "payment_event_payment_time_idx" ON "payment_event" USING btree ("payment_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_event_actor_idx" ON "payment_event" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_settlement_payment_unique" ON "payment_settlement" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_settlement_idempotency_unique" ON "payment_settlement" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_settlement_order_idx" ON "payment_settlement" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_settlement_actor_idx" ON "payment_settlement" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "shipment_order_idx" ON "shipment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipment_status_time_idx" ON "shipment" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_reservation_idempotency_unique" ON "inventory_reservation" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_reservation_active_cart_item_unique" ON "inventory_reservation" USING btree ("source_cart_item_id") WHERE "inventory_reservation"."status" = 'active';--> statement-breakpoint
CREATE INDEX "inventory_reservation_variant_active_idx" ON "inventory_reservation" USING btree ("variant_id","expires_at") WHERE "inventory_reservation"."status" = 'active';--> statement-breakpoint
CREATE INDEX "inventory_reservation_order_line_idx" ON "inventory_reservation" USING btree ("order_line_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_time_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_time_idx" ON "audit_log" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_deduplication_unique" ON "notification_outbox" USING btree ("deduplication_key");--> statement-breakpoint
CREATE INDEX "notification_outbox_delivery_idx" ON "notification_outbox" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "notification_outbox_aggregate_idx" ON "notification_outbox" USING btree ("aggregate_type","aggregate_id");