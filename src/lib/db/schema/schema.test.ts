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
  "auth_two_factor",
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
    const names = tableConfigs()
      .map((table) => table.name)
      .sort();

    // Then: every approved table is present exactly once
    expect(names).toEqual([...EXPECTED_TABLES].sort());
  });

  it("uses reservation rows instead of a mutable reserved inventory counter", () => {
    // Given: the inventory aggregate
    const inventory = tableConfigs().find(
      (table) => table.name === "inventory",
    );

    // When: its persisted columns are inspected
    const columns = inventory?.columns.map((column) => column.name);

    // Then: on-hand and version are stored, while reserved is derived
    expect(columns).toEqual(["variantId", "onHand", "version", "updatedAt"]);
  });

  it("keeps localized catalogue copy in translation tables", () => {
    // Given: the product aggregate and its translations
    const product = tableConfigs().find((table) => table.name === "product");
    const translation = tableConfigs().find(
      (table) => table.name === "product_translation",
    );

    // When: their column ownership is inspected
    const productColumns = product?.columns.map((column) => column.name);
    const translationColumns = translation?.columns.map(
      (column) => column.name,
    );

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

  it("locks phone, placeholder email, and closed-account identity invariants", () => {
    // Given: the canonical identity table
    const identity = tableConfigs().find((table) => table.name === "person");

    // When: Better Auth and account-lifecycle columns and checks are inspected
    const columns = identity?.columns.map((column) => column.name);
    const checks = identity?.checks.map((constraint) => constraint.name);

    // Then: E.164, placeholder, and closed-account rules are database-owned
    expect(columns).toContain("twoFactorEnabled");
    expect(columns).toContain("closedAt");
    expect(checks).toEqual(
      expect.arrayContaining([
        "person_phone_e164_check",
        "person_placeholder_email_check",
        "person_closed_account_check",
      ]),
    );
  });

  it("matches the Better Auth 1.7.1 core and plugin field mappings", () => {
    // Given: the four Better Auth core models mapped into the domain schema
    const tables = new Map(tableConfigs().map((table) => [table.name, table]));

    // When: their persisted fields are inspected
    const fields = Object.fromEntries(
      ["person", "auth_session", "auth_account", "auth_verification"].map(
        (name) => [
          name,
          tables.get(name)?.columns.map((column) => column.name),
        ],
      ),
    );

    // Then: every adapter-owned core field has one canonical column
    expect(fields.person).toEqual(
      expect.arrayContaining([
        "id",
        "displayName",
        "email",
        "emailVerified",
        "image",
        "phone",
        "phoneVerified",
        "twoFactorEnabled",
        "createdAt",
        "updatedAt",
      ]),
    );
    expect(fields.auth_session).toEqual(
      expect.arrayContaining([
        "id",
        "expiresAt",
        "token",
        "createdAt",
        "updatedAt",
        "ipAddress",
        "userAgent",
        "personId",
      ]),
    );
    expect(fields.auth_account).toEqual(
      expect.arrayContaining([
        "id",
        "issuer",
        "accountId",
        "providerId",
        "personId",
        "password",
        "createdAt",
        "updatedAt",
      ]),
    );
    expect(fields.auth_verification).toEqual([
      "id",
      "identifier",
      "value",
      "expiresAt",
      "createdAt",
      "updatedAt",
    ]);
  });

  it("persists Better Auth TOTP state and lockout counters", () => {
    // Given: Better Auth's two-factor plugin table
    const twoFactor = tableConfigs().find(
      (table) => table.name === "auth_two_factor",
    );

    // When: its persisted fields are inspected
    const columns = twoFactor?.columns.map((column) => column.name);

    // Then: secrets, backup codes, verification state, and lockout state are durable
    expect(columns).toEqual([
      "id",
      "secret",
      "backupCodes",
      "personId",
      "verified",
      "failedVerificationCount",
      "lockedUntil",
    ]);
  });

  it("stores an immutable contact-phone snapshot on every order", () => {
    // Given: the order aggregate retained after account closure
    const order = tableConfigs().find(
      (table) => table.name === "customer_order",
    );

    // When: its contact fields are inspected
    const contactPhone = order?.columns.find(
      (column) => column.name === "contactPhone",
    );

    // Then: the historical contact is required independently of person identity
    expect(contactPhone?.notNull).toBe(true);
  });

  it("lets an order outlive its customer instead of blocking the delete", () => {
    // Given: person_id is ON DELETE SET NULL and contact_phone is the snapshot
    const order = tableConfigs().find(
      (table) => table.name === "customer_order",
    );

    // When: the historical contact check is looked for
    const contactCheck = order?.checks.find(
      (check) => check.name === "customer_order_contact_check",
    );

    // Then: it is gone, so setting person_id to null cannot abort the cascade
    expect(contactCheck).toBeUndefined();
  });

  it("reaches an order only through the payment being settled", () => {
    // Given: the settlement row, which must never name a foreign order
    const settlement = tableConfigs().find(
      (table) => table.name === "payment_settlement",
    );

    // When: its foreign keys are inspected
    const references = settlement?.foreignKeys.map((key) => {
      const { columns, foreignColumns } = key.reference();
      return {
        columns: columns.map((column) => column.name),
        foreignTable: foreignColumns[0]?.table
          ? getTableConfig(foreignColumns[0].table as PgTable).name
          : undefined,
        foreignColumns: foreignColumns.map((column) => column.name),
      };
    });

    // Then: payment and order travel together, and no independent order key
    // remains for a transposed variable to satisfy
    expect(references).toContainEqual({
      columns: ["paymentId", "orderId"],
      foreignTable: "payment",
      foreignColumns: ["id", "orderId"],
    });
    expect(
      references?.filter(
        (reference) =>
          reference.foreignTable === "customer_order" &&
          reference.columns.length === 1,
      ),
    ).toEqual([]);
  });

  it("indexes normalized search text for infix matching, not only prefixes", () => {
    // Given: PostgreSQL has no Persian stemmer, so trigram is the launch choice
    const translation = tableConfigs().find(
      (table) => table.name === "product_translation",
    );

    // When: the indexes on the search column are inspected
    const names = translation?.indexes.map((entry) => entry.config.name);

    // Then: both the locale-scoped btree and the trigram GIN index exist —
    // the btree serves prefix and exact lookups, the GIN serves infix and typos
    expect(names).toContain("product_translation_search_idx");
    expect(names).toContain("product_translation_search_trgm_idx");

    const trigram = translation?.indexes.find(
      (entry) => entry.config.name === "product_translation_search_trgm_idx",
    );
    expect(trigram?.config.method).toBe("gin");
  });
});
