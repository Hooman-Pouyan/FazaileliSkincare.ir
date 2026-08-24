import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from ".";

const EXPECTED_TABLES = [
  "address",
  "audit_log",
  "auth_account",
  "auth_rate_limit",
  "auth_session",
  "auth_verification",
  "bank_transfer_claim",
  "brand",
  "brand_translation",
  "cart",
  "cart_item",
  "category",
  "category_translation",
  "concern",
  "concern_translation",
  "customer_order",
  "inventory",
  "inventory_movement",
  "inventory_reservation",
  "locale",
  "notification_outbox",
  "order_line",
  "payment",
  "payment_event",
  "payment_settlement",
  "person",
  "person_role",
  "price",
  "price_adjustment_batch",
  "price_history",
  "product",
  "product_concern",
  "product_line",
  "product_line_translation",
  "product_media",
  "product_media_translation",
  "product_protocol_phase",
  "product_skin_state",
  "product_translation",
  "protocol",
  "protocol_phase",
  "protocol_phase_translation",
  "protocol_translation",
  "shipment",
  "skin_state",
  "skin_state_translation",
  "variant",
  "variant_translation",
] as const;

function tableConfigs() {
  return Object.values(schema)
    .filter((value) => is(value, PgTable))
    .map((table) => getTableConfig(table));
}

describe("database schema contract", () => {
  it("exports the complete identity, catalogue, inventory, and commerce model", () => {
    // Given: the schema barrel used by Drizzle migrations
    // When: its PostgreSQL tables are enumerated
    const names = tableConfigs().map((table) => table.name).sort();

    // Then: every approved table is present exactly once
    expect(names).toEqual([...EXPECTED_TABLES].sort());
  });

  it("uses reservation rows instead of a mutable reserved inventory counter", () => {
    // Given: the inventory aggregate
    const inventory = tableConfigs().find((table) => table.name === "inventory");

    // When: its persisted columns are inspected
    const columns = inventory?.columns.map((column) => column.name);

    // Then: on-hand and version are stored, while reserved is derived
    expect(columns).toEqual(["variantId", "onHand", "version", "updatedAt"]);
  });

  it("keeps localized catalogue copy in translation tables", () => {
    // Given: the product aggregate and its translations
    const product = tableConfigs().find((table) => table.name === "product");
    const translation = tableConfigs().find((table) => table.name === "product_translation");

    // When: their column ownership is inspected
    const productColumns = product?.columns.map((column) => column.name);
    const translationColumns = translation?.columns.map((column) => column.name);

    // Then: display copy is locale-owned, not fixed to language-specific product columns
    expect(productColumns).not.toContain("name_fa");
    expect(translationColumns).toEqual([
      "productId",
      "localeCode",
      "name",
      "promise",
      "description",
      "ingredients",
      "usage",
      "suitableFor",
      "normalizedSearchText",
    ]);
  });
});
