CREATE TYPE "public"."content_block_kind" AS ENUM('faq', 'editorial', 'gallery', 'campaign');--> statement-breakpoint
CREATE TYPE "public"."content_review_state" AS ENUM('draft', 'reviewed', 'approved');--> statement-breakpoint
CREATE TYPE "public"."content_scope_kind" AS ENUM('concern', 'brand', 'category');--> statement-breakpoint
CREATE TYPE "public"."content_surface" AS ENUM('shop.hub', 'shop.listing', 'pdp', 'landing', 'booking', 'academy');--> statement-breakpoint
CREATE TABLE "content_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"kind" "content_block_kind" NOT NULL,
	"surface" "content_surface" NOT NULL,
	"scope_kind" "content_scope_kind",
	"scope_slug" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"review_state" "content_review_state" DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"author_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_block_scope_check" CHECK (("content_block"."scope_kind" is null and "content_block"."scope_slug" is null) or ("content_block"."scope_kind" is not null and "content_block"."scope_slug" is not null)),
	CONSTRAINT "content_block_window_check" CHECK ("content_block"."effective_from" is null or "content_block"."effective_until" is null or "content_block"."effective_until" > "content_block"."effective_from"),
	CONSTRAINT "content_block_published_state_check" CHECK (not "content_block"."is_published" or "content_block"."review_state" = 'approved')
);
--> statement-breakpoint
CREATE TABLE "content_block_translation" (
	"content_block_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"heading" text,
	"body" text,
	"cta_label" text,
	"cta_href" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_block_translation_content_block_id_locale_code_pk" PRIMARY KEY("content_block_id","locale_code"),
	CONSTRAINT "content_block_translation_cta_check" CHECK (("content_block_translation"."cta_label" is null and "content_block_translation"."cta_href" is null) or ("content_block_translation"."cta_label" is not null and "content_block_translation"."cta_href" is not null)),
	CONSTRAINT "content_block_translation_cta_href_check" CHECK ("content_block_translation"."cta_href" is null or "content_block_translation"."cta_href" ~ '^/')
);
--> statement-breakpoint
CREATE TABLE "content_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_block_id" uuid NOT NULL,
	"key" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"media_object_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_item_media_key_check" CHECK ("content_item"."media_object_key" is null or "content_item"."media_object_key" ~ '^[a-z0-9][a-z0-9._/-]*[a-z0-9]$')
);
--> statement-breakpoint
CREATE TABLE "content_item_translation" (
	"content_item_id" uuid NOT NULL,
	"locale_code" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"media_alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_item_translation_content_item_id_locale_code_pk" PRIMARY KEY("content_item_id","locale_code")
);
--> statement-breakpoint
ALTER TABLE "content_block_translation" ADD CONSTRAINT "content_block_translation_content_block_id_content_block_id_fk" FOREIGN KEY ("content_block_id") REFERENCES "public"."content_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_translation" ADD CONSTRAINT "content_block_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_item" ADD CONSTRAINT "content_item_content_block_id_content_block_id_fk" FOREIGN KEY ("content_block_id") REFERENCES "public"."content_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_item_translation" ADD CONSTRAINT "content_item_translation_content_item_id_content_item_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_item_translation" ADD CONSTRAINT "content_item_translation_locale_code_locale_code_fk" FOREIGN KEY ("locale_code") REFERENCES "public"."locale"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_block_key_unique" ON "content_block" USING btree ("key");--> statement-breakpoint
CREATE INDEX "content_block_placement_idx" ON "content_block" USING btree ("surface","scope_kind","scope_slug","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "content_item_block_key_unique" ON "content_item" USING btree ("content_block_id","key");--> statement-breakpoint
CREATE INDEX "content_item_block_sort_idx" ON "content_item" USING btree ("content_block_id","sort_order","id");