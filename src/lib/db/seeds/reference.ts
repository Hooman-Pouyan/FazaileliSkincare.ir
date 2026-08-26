import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { normalizeCatalogSearchText } from "../normalize-catalog-search";
import {
  concern,
  concernTranslation,
  locale,
  protocol,
  protocolPhase,
  protocolPhaseTranslation,
  protocolTranslation,
  skinState,
  skinStateTranslation,
} from "../schema";
import type * as schema from "../schema";
import {
  REFERENCE_CONCERNS,
  REFERENCE_LOCALES,
  REFERENCE_PROTOCOL,
  REFERENCE_SKIN_STATES,
} from "./reference-data";

export class ReferenceSeedError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(`Reference seed did not return concern: ${slug}`);
    this.name = "ReferenceSeedError";
    this.slug = slug;
  }
}

export async function seedReference(
  database: PostgresJsDatabase<typeof schema>,
): Promise<void> {
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
            target: [
              concernTranslation.concernId,
              concernTranslation.localeCode,
            ],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }
    }

    /*
      Skin states and protocol phases are reference taxonomy in exactly the same
      sense concerns are: canonical, translated, and owned here rather than by a
      product seed. They were missing, which is why the `skin_type` and `phase`
      facets rendered nothing — the manifest was right and the data was absent.
    */
    for (const entry of REFERENCE_SKIN_STATES) {
      const rows = await transaction
        .insert(skinState)
        .values({ slug: entry.slug, sortOrder: entry.sortOrder })
        .onConflictDoUpdate({
          target: skinState.slug,
          set: { sortOrder: entry.sortOrder, updatedAt: new Date() },
        })
        .returning({ id: skinState.id });
      const seeded = rows[0];
      if (!seeded) throw new ReferenceSeedError(entry.slug);

      for (const translation of entry.translations) {
        await transaction
          .insert(skinStateTranslation)
          .values({
            skinStateId: seeded.id,
            localeCode: translation.localeCode,
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          })
          .onConflictDoUpdate({
            target: [
              skinStateTranslation.skinStateId,
              skinStateTranslation.localeCode,
            ],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }
    }

    const protocolRows = await transaction
      .insert(protocol)
      .values({ slug: REFERENCE_PROTOCOL.slug })
      .onConflictDoUpdate({
        target: protocol.slug,
        set: { updatedAt: new Date() },
      })
      .returning({ id: protocol.id });
    const seededProtocol = protocolRows[0];
    if (!seededProtocol) throw new ReferenceSeedError(REFERENCE_PROTOCOL.slug);

    for (const translation of REFERENCE_PROTOCOL.translations) {
      await transaction
        .insert(protocolTranslation)
        .values({
          protocolId: seededProtocol.id,
          localeCode: translation.localeCode,
          name: translation.name,
          normalizedName: normalizeCatalogSearchText(translation.name),
        })
        .onConflictDoUpdate({
          target: [
            protocolTranslation.protocolId,
            protocolTranslation.localeCode,
          ],
          set: {
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          },
        });
    }

    for (const phase of REFERENCE_PROTOCOL.phases) {
      const phaseRows = await transaction
        .insert(protocolPhase)
        .values({
          protocolId: seededProtocol.id,
          slug: phase.slug,
          sortOrder: phase.sortOrder,
        })
        .onConflictDoUpdate({
          target: [protocolPhase.protocolId, protocolPhase.slug],
          set: { sortOrder: phase.sortOrder, updatedAt: new Date() },
        })
        .returning({ id: protocolPhase.id });
      const seededPhase = phaseRows[0];
      if (!seededPhase) throw new ReferenceSeedError(phase.slug);

      for (const translation of phase.translations) {
        await transaction
          .insert(protocolPhaseTranslation)
          .values({
            protocolPhaseId: seededPhase.id,
            localeCode: translation.localeCode,
            name: translation.name,
            normalizedName: normalizeCatalogSearchText(translation.name),
          })
          .onConflictDoUpdate({
            target: [
              protocolPhaseTranslation.protocolPhaseId,
              protocolPhaseTranslation.localeCode,
            ],
            set: {
              name: translation.name,
              normalizedName: normalizeCatalogSearchText(translation.name),
            },
          });
      }
    }
  });
}
