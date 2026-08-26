import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { isObjectKey } from "@/lib/media/url";
import type * as schema from "../schema";
import {
  brand,
  category,
  concern,
  contentBlock,
  contentBlockTranslation,
  contentItem,
  contentItemTranslation,
  locale,
} from "../schema";
import {
  CONTENT_AUTHOR_NOTE,
  CONTENT_BLOCKS,
  type SeedContentItem,
} from "./content-data";

/**
 * The curated testimonials, parsed.
 *
 * Read from a file rather than written inline because they are other people's
 * words: the edit that produced each display quote has to sit beside the
 * transcription it came from and the consent that permits it. A TypeScript
 * literal cannot show that, and `E-3` turns on being able to.
 */
const CuratedTestimonials = z.object({
  consentSource: z.string().min(1),
  reconciliation: z.object({
    transcribed: z.number().int(),
    published: z.number().int(),
    held: z.number().int(),
  }),
  records: z.array(
    z.object({
      id: z.string().min(1),
      role: z.enum(["client", "student", "peer"]).nullable(),
      roleLabel: z.object({ fa: z.string(), en: z.string() }).nullable(),
      displayQuoteFa: z.string().min(1).nullable(),
      disposition: z.enum(["publish", "hold"]),
      holdReason: z.string().nullable(),
      publicationConsent: z.literal("granted"),
    }),
  ),
});

function curatedTestimonials(): readonly SeedContentItem[] {
  const parsed = CuratedTestimonials.parse(
    JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          "../../../../content/testimonials/curated-2026-08-26.json",
        ),
        "utf8",
      ),
    ),
  );

  return parsed.records
    .filter((record) => record.disposition === "publish")
    .map((record) => {
      if (!record.displayQuoteFa || !record.roleLabel) {
        throw new ContentSeedRefusedError(
          `${record.id} is marked publish with no display quote. Re-run \`pnpm content:testimonials\`.`,
        );
      }
      return {
        key: record.id,
        title: { fa: record.roleLabel.fa, en: record.roleLabel.en },
        // Persian only, deliberately. Translating someone's testimonial puts
        // words in their mouth in a language they did not speak, so the English
        // row simply has no body — and the exact-locale read then drops the
        // quote on `/en` rather than showing Persian to an English reader.
        body: { fa: record.displayQuoteFa },
      };
    });
}

/**
 * Seeds the content spine — `CONTENT3`.
 *
 * Everything it writes is `reviewState: "draft"` and unpublished. That is not
 * a formality: `content_block_published_state_check` refuses a published draft,
 * so no path through this seeder can put unreviewed copy in front of a
 * customer. Development sees it through the server-owned draft preview.
 */

export class ContentSeedRefusedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ContentSeedRefusedError";
  }
}

export function assertContentSeedAllowed(nodeEnv: string | undefined): void {
  if (nodeEnv === "production") {
    throw new ContentSeedRefusedError(
      "The seeded editorial copy is written in Mahdieh's voice and she has not reviewed it. It must never run against production.",
    );
  }
}

/** Days from a fixed base, so a re-run does not move a campaign's window. */
function offsetDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const SEEDED_LOCALES = ["fa", "en"] as const;
type SeededLocale = (typeof SEEDED_LOCALES)[number];

export async function seedContent(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
  now: Date = new Date(),
): Promise<void> {
  assertContentSeedAllowed(nodeEnv);

  await database.transaction(async (transaction) => {
    const locales = new Set(
      (await transaction.select({ code: locale.code }).from(locale)).map(
        (row) => row.code,
      ),
    );
    if (locales.size === 0) {
      throw new ContentSeedRefusedError(
        "No locales found. Run `pnpm db:seed reference` first.",
      );
    }

    /*
      `scopeSlug` is not a foreign key — a block may be written before its
      concern exists, and deleting a taxonomy row should orphan a block rather
      than delete someone's writing. The check belongs here instead, where a
      typo fails loudly with the slug in the message. `F-8` is the reason: a
      block that matches nothing and a block that is broken look identical from
      outside.
    */
    const known = {
      concern: new Set(
        (await transaction.select({ slug: concern.slug }).from(concern)).map(
          (row) => row.slug,
        ),
      ),
      brand: new Set(
        (await transaction.select({ slug: brand.slug }).from(brand)).map(
          (row) => row.slug,
        ),
      ),
      category: new Set(
        (await transaction.select({ slug: category.slug }).from(category)).map(
          (row) => row.slug,
        ),
      ),
    } as const;

    for (const entry of CONTENT_BLOCKS) {
      if (entry.scopeKind && entry.scopeSlug) {
        if (!known[entry.scopeKind].has(entry.scopeSlug)) {
          throw new ContentSeedRefusedError(
            `Block ${entry.key} targets ${entry.scopeKind} "${entry.scopeSlug}", which does not exist. ` +
              "Seed the catalogue it refers to first, or fix the slug.",
          );
        }
      }

      const effectiveFrom =
        entry.effectiveFromDays === undefined
          ? null
          : offsetDays(now, entry.effectiveFromDays);
      const effectiveUntil =
        entry.effectiveUntilDays === undefined
          ? null
          : offsetDays(now, entry.effectiveUntilDays);

      const values = {
        key: entry.key,
        kind: entry.kind,
        surface: entry.surface,
        scopeKind: entry.scopeKind ?? null,
        scopeSlug: entry.scopeSlug ?? null,
        sortOrder: entry.sortOrder,
        reviewState: "draft",
        isPublished: false,
        effectiveFrom,
        effectiveUntil,
        authorNote: CONTENT_AUTHOR_NOTE,
      } as const;

      const [row] = await transaction
        .insert(contentBlock)
        .values(values)
        .onConflictDoUpdate({
          target: contentBlock.key,
          set: { ...values, updatedAt: new Date() },
        })
        .returning({ id: contentBlock.id });
      if (!row) {
        throw new ContentSeedRefusedError(`Block upsert failed: ${entry.key}`);
      }

      for (const localeCode of SEEDED_LOCALES) {
        if (!locales.has(localeCode)) continue;
        const translation = {
          contentBlockId: row.id,
          localeCode,
          heading: entry.heading?.[localeCode] ?? null,
          body: entry.body?.[localeCode] ?? null,
          ctaLabel: entry.cta?.label[localeCode] ?? null,
          ctaHref: entry.cta?.href ?? null,
        };
        await transaction
          .insert(contentBlockTranslation)
          .values(translation)
          .onConflictDoUpdate({
            target: [
              contentBlockTranslation.contentBlockId,
              contentBlockTranslation.localeCode,
            ],
            set: { ...translation, updatedAt: new Date() },
          });
      }

      const items =
        entry.itemsFrom === "testimonials"
          ? curatedTestimonials()
          : (entry.items ?? []);
      for (const [index, item] of items.entries()) {
        if (item.mediaObjectKey && !isObjectKey(item.mediaObjectKey)) {
          throw new ContentSeedRefusedError(
            `Block ${entry.key} item "${item.key}" has a media value that is not an object key: ${item.mediaObjectKey}`,
          );
        }

        const itemValues = {
          contentBlockId: row.id,
          key: item.key,
          sortOrder: index * 10,
          mediaObjectKey: item.mediaObjectKey ?? null,
        };
        const [itemRow] = await transaction
          .insert(contentItem)
          .values(itemValues)
          .onConflictDoUpdate({
            target: [contentItem.contentBlockId, contentItem.key],
            set: { ...itemValues, updatedAt: new Date() },
          })
          .returning({ id: contentItem.id });
        if (!itemRow) {
          throw new ContentSeedRefusedError(
            `Item upsert failed: ${entry.key}/${item.key}`,
          );
        }

        for (const localeCode of SEEDED_LOCALES) {
          if (!locales.has(localeCode)) continue;
          const translation = {
            contentItemId: itemRow.id,
            localeCode,
            title: item.title[localeCode],
            body: item.body?.[localeCode] ?? null,
            mediaAlt: item.mediaAlt?.[localeCode] ?? null,
          };
          await transaction
            .insert(contentItemTranslation)
            .values(translation)
            .onConflictDoUpdate({
              target: [
                contentItemTranslation.contentItemId,
                contentItemTranslation.localeCode,
              ],
              set: { ...translation, updatedAt: new Date() },
            });
        }
      }

      /*
        An item removed from the seed data is removed from the database. Without
        this, editing a question out of the file leaves it on the page, and the
        seed stops being the source of truth the moment anyone edits it.
      */
      const keys = items.map((item) => item.key);
      const existing = await transaction
        .select({ id: contentItem.id, key: contentItem.key })
        .from(contentItem)
        .where(eq(contentItem.contentBlockId, row.id));

      const orphans = existing
        .filter((item) => !keys.includes(item.key))
        .map((item) => item.id);
      if (orphans.length > 0) {
        await transaction
          .delete(contentItem)
          .where(inArray(contentItem.id, orphans));
      }
    }
  });
}

/** Removes only the blocks this seed creates, by key. */
export async function clearContent(
  database: PostgresJsDatabase<typeof schema>,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): Promise<void> {
  assertContentSeedAllowed(nodeEnv);
  await database.delete(contentBlock).where(
    inArray(
      contentBlock.key,
      CONTENT_BLOCKS.map((entry) => entry.key),
    ),
  );
}
