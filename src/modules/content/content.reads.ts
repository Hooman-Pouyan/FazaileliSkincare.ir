import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contentBlock,
  contentBlockTranslation,
  contentItem,
  contentItemTranslation,
} from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media/url";
import { type DraftPreview, resolveDraftPreview } from "@/lib/preview";
import {
  type ContentBlockKind,
  type ContentScope,
  type ContentSurface,
  isLive,
  selectScoped,
} from "./models/resolution";

/**
 * The only public read of the content spine.
 *
 * Every surface asks the same question — "what copy belongs here, for this
 * reader, right now" — and gets back view models with no row types in them.
 * Commerce maps the result into its own page model rather than importing these
 * types, per the module rule in `AGENTS.md`.
 */

export type ContentMedia = Readonly<{ url: string; alt: string | null }>;

export type ContentItemView = Readonly<{
  key: string;
  title: string;
  body: string | null;
  media: ContentMedia | null;
}>;

export type ContentBlockView = Readonly<{
  key: string;
  kind: ContentBlockKind;
  heading: string | null;
  body: string | null;
  cta: Readonly<{ label: string; href: string }> | null;
  items: readonly ContentItemView[];
}>;

export type ResolveBlocksInput = Readonly<{
  surface: ContentSurface;
  scope: ContentScope;
  localeCode: string;
  now?: Date;
  preview?: DraftPreview;
}>;

export async function resolveBlocks(
  input: ResolveBlocksInput,
): Promise<readonly ContentBlockView[]> {
  const now = input.now ?? new Date();
  const preview = input.preview ?? resolveDraftPreview();

  /*
    An inner join on the translation, not a left join. A block with no row for
    the requested locale is absent rather than falling back to Persian — the
    same exact-locale rule the catalogue follows, for the same reason: an answer
    in the wrong language is worse than no answer.
  */
  const rows = await db
    .select({
      id: contentBlock.id,
      key: contentBlock.key,
      kind: contentBlock.kind,
      scopeKind: contentBlock.scopeKind,
      scopeSlug: contentBlock.scopeSlug,
      sortOrder: contentBlock.sortOrder,
      reviewState: contentBlock.reviewState,
      isPublished: contentBlock.isPublished,
      effectiveFrom: contentBlock.effectiveFrom,
      effectiveUntil: contentBlock.effectiveUntil,
      heading: contentBlockTranslation.heading,
      body: contentBlockTranslation.body,
      ctaLabel: contentBlockTranslation.ctaLabel,
      ctaHref: contentBlockTranslation.ctaHref,
    })
    .from(contentBlock)
    .innerJoin(
      contentBlockTranslation,
      and(
        eq(contentBlockTranslation.contentBlockId, contentBlock.id),
        eq(contentBlockTranslation.localeCode, input.localeCode),
      ),
    )
    .where(eq(contentBlock.surface, input.surface))
    .orderBy(asc(contentBlock.sortOrder), asc(contentBlock.key));

  /*
    Publication, window and scope are decided in `models/resolution.ts` rather
    than in the WHERE clause. The set is small — a handful of blocks per surface
    — and the rules are the part worth testing without a database.
  */
  const live = rows.filter((row) => isLive(row, now, preview));
  const chosen = selectScoped(live, input.scope);
  if (chosen.length === 0) return [];

  const itemRows = await db
    .select({
      blockId: contentItem.contentBlockId,
      key: contentItem.key,
      sortOrder: contentItem.sortOrder,
      mediaObjectKey: contentItem.mediaObjectKey,
      title: contentItemTranslation.title,
      body: contentItemTranslation.body,
      mediaAlt: contentItemTranslation.mediaAlt,
    })
    .from(contentItem)
    .innerJoin(
      contentItemTranslation,
      and(
        eq(contentItemTranslation.contentItemId, contentItem.id),
        eq(contentItemTranslation.localeCode, input.localeCode),
      ),
    )
    .where(
      inArray(
        contentItem.contentBlockId,
        chosen.map((block) => block.id),
      ),
    )
    .orderBy(asc(contentItem.sortOrder), asc(contentItem.key));

  const itemsByBlock = new Map<string, ContentItemView[]>();
  for (const row of itemRows) {
    const list = itemsByBlock.get(row.blockId) ?? [];
    list.push({
      key: row.key,
      title: row.title,
      body: row.body,
      media: row.mediaObjectKey
        ? { url: mediaUrl(row.mediaObjectKey), alt: row.mediaAlt }
        : null,
    });
    itemsByBlock.set(row.blockId, list);
  }

  return chosen.map((block) => ({
    key: block.key,
    kind: block.kind,
    heading: block.heading,
    body: block.body,
    // The schema already refuses one half of a call to action. This narrows the
    // pair for the renderer so a component never has to ask.
    cta:
      block.ctaLabel && block.ctaHref
        ? { label: block.ctaLabel, href: block.ctaHref }
        : null,
    items: itemsByBlock.get(block.id) ?? [],
  }));
}
