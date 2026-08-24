import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { normalizeCatalogSearchText } from "../normalize-catalog-search";
import { concern, concernTranslation, locale } from "../schema";
import type * as schema from "../schema";
import { REFERENCE_CONCERNS, REFERENCE_LOCALES } from "./reference-data";

export class ReferenceSeedError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(`Reference seed did not return concern: ${slug}`);
    this.name = "ReferenceSeedError";
    this.slug = slug;
  }
}

export async function seedReference(database: PostgresJsDatabase<typeof schema>): Promise<void> {
  await database.transaction(async (transaction) => {
    await transaction.update(locale).set({ isPrimary: false });

    for (const entry of REFERENCE_LOCALES) {
      await transaction
        .insert(locale)
        .values(entry)
        .onConflictDoUpdate({
          target: locale.code,
          set: {
            direction: entry.direction,
            isPrimary: entry.isPrimary,
            isActive: entry.isActive,
          },
        });
    }

    for (const entry of REFERENCE_CONCERNS) {
      const rows = await transaction
        .insert(concern)
        .values({ slug: entry.slug, sortOrder: entry.sortOrder })
        .onConflictDoUpdate({
          target: concern.slug,
          set: { sortOrder: entry.sortOrder, updatedAt: new Date() },
        })
        .returning({ id: concern.id });
      const seededConcern = rows[0];
      if (!seededConcern) throw new ReferenceSeedError(entry.slug);

      for (const translation of entry.translations) {
        await transaction
          .insert(concernTranslation)
          .values({
            concernId: seededConcern.id,
            localeCode: translation.localeCode,
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          })
          .onConflictDoUpdate({
            target: [concernTranslation.concernId, concernTranslation.localeCode],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }
    }
  });
}
