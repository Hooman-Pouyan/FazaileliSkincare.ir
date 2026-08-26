import { sql } from "drizzle-orm";
import { iranCity, iranProvince } from "./geo";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { roleEnum, textDirectionEnum } from "./enums";

export const locale = pgTable(
  "locale",
  {
    code: text().primaryKey(),
    direction: textDirectionEnum().notNull(),
    isPrimary: boolean().notNull().default(false),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("locale_one_primary_unique")
      .on(table.isPrimary)
      .where(sql`${table.isPrimary}`),
  ],
);

export const person = pgTable(
  "person",
  {
    id: uuid().primaryKey().defaultRandom(),
    displayName: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull().default(false),
    emailIsPlaceholder: boolean().notNull().default(false),
    image: text(),
    phone: text(),
    phoneVerified: boolean().notNull().default(false),
    twoFactorEnabled: boolean().notNull().default(false),
    firstName: text(),
    lastName: text(),
    preferredLocaleCode: text()
      .notNull()
      .default("fa")
      .references(() => locale.code, { onDelete: "restrict" }),
    closedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("person_email_unique").on(sql`lower(${table.email})`),
    uniqueIndex("person_phone_unique")
      .on(table.phone)
      .where(sql`${table.phone} is not null`),
    index("person_preferred_locale_idx").on(table.preferredLocaleCode),
    check(
      "person_phone_e164_check",
      sql`${table.phone} is null or ${table.phone} ~ '^\\+[1-9][0-9]{7,14}$'`,
    ),
    check(
      "person_verified_phone_check",
      sql`not ${table.phoneVerified} or ${table.phone} is not null`,
    ),
    check(
      "person_placeholder_email_check",
      sql`not ${table.emailIsPlaceholder} or (not ${table.emailVerified} and lower(${table.email}) ~ '^[^@]+@[^@]+\\.invalid$')`,
    ),
    check(
      "person_closed_account_check",
      sql`${table.closedAt} is null or (${table.phone} is null and not ${table.phoneVerified} and not ${table.emailVerified} and ${table.emailIsPlaceholder})`,
    ),
  ],
);

export const personRole = pgTable(
  "person_role",
  {
    personId: uuid()
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    role: roleEnum().notNull(),
  },
  (table) => [primaryKey({ columns: [table.personId, table.role] })],
);

export const address = pgTable(
  "address",
  {
    id: uuid().primaryKey().defaultRandom(),
    personId: uuid()
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    recipientName: text().notNull(),
    recipientPhone: text().notNull(),
    /*
      Canonical codes, not free text — the reason `iran_province` and
      `iran_city` exist (`COM0` §3.2).

      `shipping_rate` prices by location, and a rate keyed on a string somebody
      typed is a rate that silently stops matching the day someone writes
      «مشهد » with a trailing space. The label a customer reads is resolved from
      the reference table at render time; the *order* keeps its own frozen label
      in `addressSnapshot`, because an order must not change when a city is
      renamed.

      Changed while `address` was still empty, which is the only cheap moment.
    */
    provinceCode: text()
      .notNull()
      .references(() => iranProvince.code, { onDelete: "restrict" }),
    cityCode: text()
      .notNull()
      .references(() => iranCity.code, { onDelete: "restrict" }),
    postalCode: text().notNull(),
    line: text().notNull(),
    isDefault: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("address_person_idx").on(table.personId),
    index("address_province_idx").on(table.provinceCode),
    index("address_city_idx").on(table.cityCode),
    uniqueIndex("address_person_default_unique")
      .on(table.personId)
      .where(sql`${table.isDefault}`),
    check(
      "address_postal_code_check",
      sql`${table.postalCode} ~ '^[0-9]{10}$'`,
    ),
  ],
);

export const authAccount = pgTable(
  "auth_account",
  {
    id: uuid().primaryKey().defaultRandom(),
    issuer: text().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    personId: uuid()
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_account_issuer_account_unique").on(
      table.issuer,
      table.accountId,
    ),
    index("auth_account_person_idx").on(table.personId),
  ],
);

export const authSession = pgTable(
  "auth_session",
  {
    id: uuid().primaryKey().defaultRandom(),
    token: text().notNull(),
    personId: uuid()
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_session_token_unique").on(table.token),
    index("auth_session_person_idx").on(table.personId),
    index("auth_session_expiry_idx").on(table.expiresAt),
  ],
);

export const authVerification = pgTable(
  "auth_verification",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const authTwoFactor = pgTable(
  "auth_two_factor",
  {
    id: uuid().primaryKey().defaultRandom(),
    secret: text().notNull(),
    backupCodes: text().notNull(),
    personId: uuid()
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    verified: boolean().notNull().default(true),
    failedVerificationCount: integer().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("auth_two_factor_secret_idx").on(table.secret),
    index("auth_two_factor_person_idx").on(table.personId),
    check(
      "auth_two_factor_failed_count_check",
      sql`${table.failedVerificationCount} >= 0`,
    ),
  ],
);

export const authRateLimit = pgTable(
  "auth_rate_limit",
  {
    id: uuid().primaryKey().defaultRandom(),
    key: text().notNull(),
    count: integer().notNull(),
    lastRequest: bigint({ mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("auth_rate_limit_key_unique").on(table.key),
    check("auth_rate_limit_count_check", sql`${table.count} >= 0`),
  ],
);
