import { pgTable, uuid, text, timestamp, boolean, pgEnum, index, unique } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "student", "practitioner", "staff", "admin"]);
export const localeEnum = pgEnum("locale", ["fa", "en"]);

/** Phone is the natural key. Iranian users log in by SMS, not email. */
export const person = pgTable("person", {
  id: uuid().primaryKey().defaultRandom(),
  phone: text().notNull(),               // E.164, normalised +98…
  phoneVerifiedAt: timestamp({ withTimezone: true }),
  email: text(),
  firstName: text(),
  lastName: text(),
  displayName: text(),
  locale: localeEnum().notNull().default("fa"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // One verified phone number ⇒ one Person. Merging duplicates later is painful.
  unique("person_phone_unique").on(t.phone),
  index("person_email_idx").on(t.email),
]);

export const personRole = pgTable("person_role", {
  personId: uuid().notNull().references(() => person.id, { onDelete: "cascade" }),
  role: roleEnum().notNull(),
}, (t) => [unique("person_role_unique").on(t.personId, t.role)]);

/** Iranian address shape: province → city → 10-digit postal code → line. */
export const address = pgTable("address", {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid().notNull().references(() => person.id, { onDelete: "cascade" }),
  recipientName: text().notNull(),
  recipientPhone: text().notNull(),
  province: text().notNull(),
  city: text().notNull(),
  postalCode: text().notNull(),
  line: text().notNull(),
  isDefault: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("address_person_idx").on(t.personId)]);
