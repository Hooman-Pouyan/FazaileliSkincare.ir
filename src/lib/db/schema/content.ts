import { sql } from "drizzle-orm";
import {
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
import {
  contentBlockKindEnum,
  contentReviewStateEnum,
  contentScopeKindEnum,
  contentSurfaceEnum,
} from "./enums";
import { locale } from "./identity";

/**
 * The content spine — four tables, shared by every surface.
 *
 * The PLP's FAQ and editorial bands read from here; so will the Landing's
 * beats, the PDP's disclosure, and Booking and Academy later. One store rather
 * than one per surface, because the alternative is a table per idea and a
 * migration per section — `C-11`.
 *
 * Not a headless CMS: hosting is inside Iran and every foreign host is a
 * hanging request (`AGENTS.md` hard rule 10). Not MDX or JSON in the
 * repository: content changes on a different clock than code, and publishing a
 * campaign should not be a deploy.
 */

export const contentBlock = pgTable(
  "content_block",
  {
    id: uuid().primaryKey().defaultRandom(),
    /**
     * The stable upsert key, e.g. `shop.listing.concern.lak.faq`. Importers key
     * on this, so re-running one updates rather than duplicates.
     */
    key: text().notNull(),
    kind: contentBlockKindEnum().notNull(),
    surface: contentSurfaceEnum().notNull(),
    /**
     * Scope narrows a block to one taxonomy row. Both columns are set or both
     * are null — a scope kind without a slug would silently match everything.
     *
     * Deliberately NOT a foreign key. A block may be authored for a concern
     * before that concern exists, and deleting a taxonomy row should orphan a
     * block rather than cascade-delete someone's writing. The seeder checks the
     * slug against the taxonomy instead, where a mistake is a loud failure with
     * a name in it.
     */
    scopeKind: contentScopeKindEnum(),
    scopeSlug: text(),
    sortOrder: integer().notNull().default(0),
    /** Publication and review are separate decisions — as on `product`. */
    reviewState: contentReviewStateEnum().notNull().default("draft"),
    isPublished: boolean().notNull().default(false),
    /**
     * A window, not a boolean — `C-13`. `L-6` refused permanent promotional
     * furniture and allowed "a dated campaign with a real end date". A boolean
     * cannot express that; it expresses "someone will remember to turn this
     * off", and nobody does.
     *
     * Both null means always-on, which is right for an FAQ and is a review
     * question for a campaign rather than a constraint.
     */
    effectiveFrom: timestamp({ withTimezone: true }),
    effectiveUntil: timestamp({ withTimezone: true }),
    /** Where the copy came from. `unreviewed_draft` for seeded voice — `C-14`. */
    authorNote: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("content_block_key_unique").on(table.key),
    index("content_block_placement_idx").on(
      table.surface,
      table.scopeKind,
      table.scopeSlug,
      table.sortOrder,
    ),
    check(
      "content_block_scope_check",
      sql`(${table.scopeKind} is null and ${table.scopeSlug} is null) or (${table.scopeKind} is not null and ${table.scopeSlug} is not null)`,
    ),
    check(
      "content_block_window_check",
      sql`${table.effectiveFrom} is null or ${table.effectiveUntil} is null or ${table.effectiveUntil} > ${table.effectiveFrom}`,
    ),
    check(
      "content_block_published_state_check",
      sql`not ${table.isPublished} or ${table.reviewState} = 'approved'`,
    ),
  ],
);

export const contentBlockTranslation = pgTable(
  "content_block_translation",
  {
    contentBlockId: uuid()
      .notNull()
      .references(() => contentBlock.id, { onDelete: "cascade" }),
    localeCode: text()
      .notNull()
      .references(() => locale.code, { onDelete: "restrict" }),
    heading: text(),
    body: text(),
    ctaLabel: text(),
    ctaHref: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.contentBlockId, table.localeCode] }),
    /**
     * A call to action needs both halves or neither. A label with no href is a
     * button that does nothing; an href with no label is invisible.
     */
    check(
      "content_block_translation_cta_check",
      sql`(${table.ctaLabel} is null and ${table.ctaHref} is null) or (${table.ctaLabel} is not null and ${table.ctaHref} is not null)`,
    ),
    /**
     * A path, never an origin. `AGENTS.md` hard rule 10 keeps foreign hosts out
     * of the runtime, and an editorial CTA is not the place to make an
     * exception.
     */
    check(
      "content_block_translation_cta_href_check",
      sql`${table.ctaHref} is null or ${table.ctaHref} ~ '^/'`,
    ),
  ],
);

/**
 * The repeated child: a question-and-answer pair inside an FAQ, a slide inside
 * a gallery, a point inside a list. One shape, because three tables would
 * differ only in column names and each would need its own translation table,
 * its own read, and its own migration the first time a surface wanted both.
 */
export const contentItem = pgTable(
  "content_item",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentBlockId: uuid()
      .notNull()
      .references(() => contentBlock.id, { onDelete: "cascade" }),
    key: text().notNull(),
    sortOrder: integer().notNull().default(0),
    /** A C-8 object key, resolved through `mediaUrl`. Never a URL. */
    mediaObjectKey: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("content_item_block_key_unique").on(
      table.contentBlockId,
      table.key,
    ),
    index("content_item_block_sort_idx").on(
      table.contentBlockId,
      table.sortOrder,
      table.id,
    ),
    check(
      "content_item_media_key_check",
      sql`${table.mediaObjectKey} is null or ${table.mediaObjectKey} ~ '^[a-z0-9][a-z0-9._/-]*[a-z0-9]$'`,
    ),
  ],
);

export const contentItemTranslation = pgTable(
  "content_item_translation",
  {
    contentItemId: uuid()
      .notNull()
      .references(() => contentItem.id, { onDelete: "cascade" }),
    localeCode: text()
      .notNull()
      .references(() => locale.code, { onDelete: "restrict" }),
    title: text().notNull(),
    body: text(),
    mediaAlt: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.contentItemId, table.localeCode] })],
);
