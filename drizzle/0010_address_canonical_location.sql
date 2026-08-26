ALTER TABLE "address" ADD COLUMN "province_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "city_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_province_code_iran_province_code_fk" FOREIGN KEY ("province_code") REFERENCES "public"."iran_province"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_city_code_iran_city_code_fk" FOREIGN KEY ("city_code") REFERENCES "public"."iran_city"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_province_idx" ON "address" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "address_city_idx" ON "address" USING btree ("city_code");