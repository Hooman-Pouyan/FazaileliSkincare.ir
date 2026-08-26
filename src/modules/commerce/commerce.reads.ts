import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brand,
  brandTranslation,
  category,
  categoryTranslation,
  concern,
  concernTranslation,
  inventory,
  price,
  product,
  productConcern,
  productLine,
  productLineTranslation,
  productMedia,
  productMediaTranslation,
  productProtocolPhase,
  productSkinState,
  productTranslation,
  protocolPhase,
  protocolPhaseTranslation,
  skinState,
  skinStateTranslation,
  variant,
  variantTranslation,
} from "@/lib/db/schema";
import { formatToman } from "@/lib/money";
import {
  type CatalogueQuery,
  type CatalogueScope,
  type CatalogueSort,
  catalogueHref,
  emptyQuery,
  parseCatalogueQuery,
} from "./models/catalogue-query";
import {
  type CataloguePreview,
  resolveCataloguePreview,
} from "./models/catalogue-preview";
import type { CustomerGroup } from "./models/offer";
import { resolveOfferState } from "./models/offer";
import {
  type StorefrontOutcome,
  invalidQuery,
  localeUnavailable,
  notFound,
  ready,
  redirect,
} from "./models/outcome";
import type {
  FacetGroup,
  PriceFacet,
  HubConcern,
  HubConcernSpotlight,
  MediaView,
  PriceView,
  ProductDetailPage,
  ProductListingPage,
  ProductTile,
  ShopHubPage,
  SortOption,
} from "./models/page-models";
import { appliedFilters, facetToggleHref } from "./utils/facets";
import { DEFAULT_PAGE_SIZE, buildPagination } from "./utils/pagination";

/**
 * Server-only. This module opens the only path from a route to Drizzle, and the
 * public surface is exactly three reads — `getShopHub`, `listProducts`,
 * `getProduct` — as the module contract requires. A route that imports Drizzle
 * directly has created a second data layer with its own idea of what is
 * publishable.
 *
 * Every read applies `isPubliclyVisible`'s conditions in SQL and
 * `resolveOfferState` in TypeScript, so a listing tile and the product page it
 * links to cannot disagree about whether something can be bought.
 *
 * Database faults are not caught here. An outage is an operational error that
 * belongs at `error.tsx`; swallowing it into an empty catalogue is how a shop
 * quietly stops selling.
 */

const SORTS: readonly CatalogueSort[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
];

/** Anonymous visitors are always `public`; roles arrive with AUTH3. */
const ANONYMOUS_GROUP: CustomerGroup = "public";

/** Bounded on purpose: the hub is an entry point, not a listing. */
const HUB_FEATURED_LIMIT = 8;

/**
 * How many concerns get a spotlight row, and how many products each shows.
 *
 * Bounded on purpose. Every spotlight is one more query, and a hub that
 * spotlights all five concerns has stopped being a hub and become a listing
 * page with headings. Three rows of three is the most a reader will actually
 * look at before scrolling.
 */
const HUB_SPOTLIGHT_CONCERNS = 3;
const HUB_SPOTLIGHT_PRODUCTS = 3;

function priceView(
  amountRials: bigint | null,
  locale: string,
): PriceView | null {
  if (amountRials === null) return null;
  return {
    amountRials,
    label: formatToman(amountRials, locale === "fa" ? "fa" : "en"),
  };
}

/** The lowest price this viewer is eligible for, across active variants. */
function eligiblePriceFloor(customerGroup: CustomerGroup) {
  return sql<bigint | null>`(
    select min(${price.amountRials})
    from ${variant}
    join ${price} on ${price.variantId} = ${variant.id}
      and ${price.customerGroup} = ${sql.raw(`'${customerGroup}'`)}
    where ${variant.productId} = ${product.id} and ${variant.isActive}
  )`;
}

/**
 * The runtime publication predicate, in SQL. It mirrors `isPubliclyVisible`
 * exactly: published, approved, translated in this locale, and at least one
 * active variant. Media is not here — that is the staff publication gate, for
 * the reasons recorded against review item LOW-8.
 */
function visibleInLocale(
  localeCode: string,
  preview: CataloguePreview = resolveCataloguePreview(),
) {
  return and(
    // Relaxed only under the server-owned draft preview, which cannot be on in
    // production. The Storyderm catalogue is real identity with unverified
    // commercial truth, so every row is draft and unpublished; approving it to
    // make a development page render would be the lie this exists to avoid.
    // See models/catalogue-preview.ts and C-4.
    preview.previewDrafts ? undefined : eq(product.isPublished, true),
    preview.previewDrafts ? undefined : eq(product.reviewState, "approved"),
    exists(
      db
        .select({ one: sql`1` })
        .from(productTranslation)
        .where(
          and(
            eq(productTranslation.productId, product.id),
            eq(productTranslation.localeCode, localeCode),
          ),
        ),
    ),
    exists(
      db
        .select({ one: sql`1` })
        .from(variant)
        .where(
          and(eq(variant.productId, product.id), eq(variant.isActive, true)),
        ),
    ),
  );
}

function inStockPredicate(customerGroup: CustomerGroup) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(variant)
      .innerJoin(inventory, eq(inventory.variantId, variant.id))
      .innerJoin(
        price,
        and(
          eq(price.variantId, variant.id),
          eq(price.customerGroup, customerGroup),
        ),
      )
      .where(
        and(
          eq(variant.productId, product.id),
          eq(variant.isActive, true),
          sql`${inventory.onHand} > 0`,
        ),
      ),
  );
}

function scopePredicate(scope: CatalogueScope, localeCode: string) {
  switch (scope.kind) {
    case "hub":
      return undefined;
    case "brand":
      return exists(
        db
          .select({ one: sql`1` })
          .from(brand)
          .where(
            and(eq(brand.id, product.brandId), eq(brand.slug, scope.slug)),
          ),
      );
    case "category":
      return exists(
        db
          .select({ one: sql`1` })
          .from(category)
          .where(
            and(
              eq(category.id, product.categoryId),
              eq(category.slug, scope.slug),
            ),
          ),
      );
    case "concern":
      return exists(
        db
          .select({ one: sql`1` })
          .from(productConcern)
          .innerJoin(concern, eq(concern.id, productConcern.concernId))
          .where(
            and(
              eq(productConcern.productId, product.id),
              eq(concern.slug, scope.slug),
            ),
          ),
      );
    case "search":
      return exists(
        db
          .select({ one: sql`1` })
          .from(productTranslation)
          .where(
            and(
              eq(productTranslation.productId, product.id),
              eq(productTranslation.localeCode, localeCode),
              sql`${productTranslation.normalizedSearchText} like ${`%${scope.query}%`}`,
            ),
          ),
      );
  }
}

function slugFilter(
  values: readonly string[],
  kind: "brand" | "category" | "concern",
  localeCode: string,
) {
  if (values.length === 0) return undefined;
  return scopeAny(values, kind, localeCode);
}

function scopeAny(
  values: readonly string[],
  kind: "brand" | "category" | "concern",
  localeCode: string,
) {
  const clauses = values.map((slug) =>
    scopePredicate({ kind, slug } as CatalogueScope, localeCode),
  );
  const defined = clauses.filter((clause) => clause !== undefined);
  if (defined.length === 0) return undefined;
  return sql.join(
    defined.map((clause) => sql`(${clause})`),
    sql` or `,
  );
}

/**
 * The three axes the facet manifest added — line, skin type and routine phase.
 *
 * They are separate from `scopePredicate` because none of them is a route scope:
 * `F-1` lists them as refinements only, and `PLP-10` requires the distinction to
 * be defined rather than left to whichever component reaches for them.
 */
function anySlugOf(
  values: readonly string[],
  kind: "line" | "skin_type" | "phase",
) {
  if (values.length === 0) return undefined;

  const clause = (slug: string) => {
    switch (kind) {
      case "line":
        return exists(
          db
            .select({ one: sql`1` })
            .from(productLine)
            .where(
              and(
                eq(productLine.id, product.lineId),
                eq(productLine.slug, slug),
              ),
            ),
        );
      case "skin_type":
        return exists(
          db
            .select({ one: sql`1` })
            .from(productSkinState)
            .innerJoin(
              skinState,
              eq(skinState.id, productSkinState.skinStateId),
            )
            .where(
              and(
                eq(productSkinState.productId, product.id),
                eq(skinState.slug, slug),
              ),
            ),
        );
      case "phase":
        return exists(
          db
            .select({ one: sql`1` })
            .from(productProtocolPhase)
            .innerJoin(
              protocolPhase,
              eq(protocolPhase.id, productProtocolPhase.protocolPhaseId),
            )
            .where(
              and(
                eq(productProtocolPhase.productId, product.id),
                eq(protocolPhase.slug, slug),
              ),
            ),
        );
    }
  };

  return sql.join(
    values.map((slug) => sql`(${clause(slug)})`),
    sql` or `,
  );
}

/**
 * Who the product is for. Single-select, and it never hides by default —
 * `D-18-2` puts professional stock on the shelf deliberately, and the
 * competitive research lists hiding eligibility under things to avoid.
 */
function audiencePredicate(audience: CatalogueQuery["audience"]) {
  if (audience === null) return undefined;
  return eq(product.isProfessionalOnly, audience === "professional");
}

function orderBy(
  sort: CatalogueSort,
  floor: ReturnType<typeof eligiblePriceFloor>,
) {
  switch (sort) {
    case "featured":
      return [asc(product.merchandisingRank), asc(product.id)];
    case "newest":
      return [desc(product.publishedAt), asc(product.id)];
    case "price_asc":
      return [sql`${floor} asc nulls last`, asc(product.id)];
    case "price_desc":
      return [sql`${floor} desc nulls last`, asc(product.id)];
  }
}

type TileRow = {
  id: string;
  slug: string;
  name: string;
  promise: string | null;
  isProfessionalOnly: boolean;
  priceVisibility: "public" | "on_request";
  brandSlug: string;
  brandName: string;
};

async function loadTiles(
  localeCode: string,
  rows: readonly TileRow[],
  customerGroup: CustomerGroup,
): Promise<readonly ProductTile[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const variantRows = await db
    .select({
      productId: variant.productId,
      id: variant.id,
      isActive: variant.isActive,
      onHand: sql<number>`coalesce(${inventory.onHand}, 0)`,
      amountRials: price.amountRials,
      customerGroup: price.customerGroup,
    })
    .from(variant)
    .leftJoin(inventory, eq(inventory.variantId, variant.id))
    .leftJoin(price, eq(price.variantId, variant.id))
    .where(inArray(variant.productId, ids));

  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      key: productMedia.cardObjectKey,
      width: productMedia.width,
      height: productMedia.height,
      alt: productMediaTranslation.altText,
    })
    .from(productMedia)
    .leftJoin(
      productMediaTranslation,
      and(
        eq(productMediaTranslation.productMediaId, productMedia.id),
        eq(productMediaTranslation.localeCode, localeCode),
      ),
    )
    .where(
      and(
        inArray(productMedia.productId, ids),
        eq(productMedia.role, "primary"),
      ),
    );

  const byProduct = new Map<string, typeof variantRows>();
  for (const row of variantRows) {
    const bucket = byProduct.get(row.productId) ?? [];
    bucket.push(row);
    byProduct.set(row.productId, bucket);
  }
  const mediaByProduct = new Map(mediaRows.map((row) => [row.productId, row]));

  return rows.map((row) => {
    const grouped = new Map<
      string,
      {
        id: string;
        isActive: boolean;
        onHand: number;
        prices: { customerGroup: CustomerGroup; amountRials: bigint }[];
      }
    >();
    for (const item of byProduct.get(row.id) ?? []) {
      const existing = grouped.get(item.id) ?? {
        id: item.id,
        isActive: item.isActive,
        onHand: Number(item.onHand),
        prices: [],
      };
      if (item.amountRials !== null && item.customerGroup !== null) {
        existing.prices.push({
          customerGroup: item.customerGroup as CustomerGroup,
          amountRials: item.amountRials,
        });
      }
      grouped.set(item.id, existing);
    }

    const offer = resolveOfferState({
      isProfessionalOnly: row.isProfessionalOnly,
      priceVisibility: row.priceVisibility,
      customerGroup,
      variants: [...grouped.values()],
    });

    const eligible = [...grouped.values()]
      .filter((entry) => entry.isActive)
      .flatMap((entry) =>
        entry.prices
          .filter((item) => item.customerGroup === customerGroup)
          .map((item) => item.amountRials),
      );
    const floor =
      eligible.length > 0 ? eligible.reduce((a, b) => (a < b ? a : b)) : null;

    const media = mediaByProduct.get(row.id);
    const image: MediaView | null =
      media?.key != null
        ? {
            src: media.key,
            alt: media.alt ?? row.name,
            width: media.width,
            height: media.height,
          }
        : null;

    return {
      slug: row.slug,
      href: `/shop/p/${row.slug}`,
      name: row.name,
      brandName: row.brandName,
      brandHref: `/shop/brand/${row.brandSlug}`,
      promise: row.promise,
      image,
      offer,
      price:
        row.priceVisibility === "on_request"
          ? null
          : priceView(floor, localeCode),
    };
  });
}

/**
 * The products behind each spotlit concern.
 *
 * One query per concern rather than one query with a window function: the set
 * is capped at three, the rows are tiny, and a readable query that runs three
 * times beats a clever one nobody can change. If this ever grows past a handful
 * of concerns it wants rewriting, and the cap above is what makes that visible.
 *
 * Products are ordered by merchandising rank, the same order the featured rail
 * uses, so a product that the institute pushes is pushed consistently.
 */
async function loadConcernSpotlights(
  localeCode: string,
  spotlitConcerns: readonly HubConcern[],
  visible: ReturnType<typeof and>,
): Promise<readonly HubConcernSpotlight[]> {
  const spotlights: HubConcernSpotlight[] = [];

  for (const entry of spotlitConcerns) {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: productTranslation.name,
        promise: productTranslation.promise,
        isProfessionalOnly: product.isProfessionalOnly,
        priceVisibility: product.priceVisibility,
        brandSlug: brand.slug,
        brandName: brandTranslation.name,
      })
      .from(product)
      .innerJoin(
        productTranslation,
        and(
          eq(productTranslation.productId, product.id),
          eq(productTranslation.localeCode, localeCode),
        ),
      )
      .innerJoin(brand, eq(brand.id, product.brandId))
      .leftJoin(
        brandTranslation,
        and(
          eq(brandTranslation.brandId, brand.id),
          eq(brandTranslation.localeCode, localeCode),
        ),
      )
      .innerJoin(productConcern, eq(productConcern.productId, product.id))
      .innerJoin(
        concern,
        and(
          eq(concern.id, productConcern.concernId),
          eq(concern.slug, entry.slug),
        ),
      )
      .where(visible)
      .orderBy(asc(product.merchandisingRank), asc(product.id))
      .limit(HUB_SPOTLIGHT_PRODUCTS);

    const products = await loadTiles(
      localeCode,
      rows.map((row) => ({
        ...row,
        brandName: row.brandName ?? row.brandSlug,
      })),
      ANONYMOUS_GROUP,
    );

    // A concern whose products all fell out of the visibility predicate gets no
    // row at all, rather than a heading over an empty shelf.
    if (products.length > 0) spotlights.push({ concern: entry, products });
  }

  return spotlights;
}

/**
 * Live counts for every facet value, one query per group.
 *
 * **The rule that makes a facet rail usable** — `PLP-03` — is that a group's own
 * selections are *removed* before its counts are computed, while every other
 * group's selections still apply. Count `brand` with the brand filter left in
 * and every unselected brand reads zero, so a shopper can only ever narrow. The
 * rail stops being a way to explore and becomes a dead end that has to be
 * cleared and restarted.
 *
 * **Why one query per group and not one clever query.** Three groups, three
 * small aggregates, each one readable on its own. A single query with
 * conditional aggregates would compute the same numbers and nobody could change
 * it later.
 *
 * **The scope's own axis is not offered as a facet.** On `/shop/concern/lak` the
 * concern is the page, not a filter; showing a concern group there would invite
 * a customer to filter a concern page by a different concern.
 *
 * A value appears when it has at least one product under the other filters, or
 * when it is currently applied — an applied value must always be removable, even
 * if another group has since reduced it to nothing.
 */
/**
 * Whether the current result set is confined to a single brand — either by the
 * route scope or by a `?brand=` narrowed to one.
 */
function spansOneBrand(query: CatalogueQuery): boolean {
  return query.scope.kind === "brand" || query.brands.length === 1;
}

async function loadFacets(
  localeCode: string,
  query: CatalogueQuery,
  clauses: Readonly<Record<string, ReturnType<typeof and> | undefined>>,
): Promise<readonly FacetGroup[]> {
  const groups: FacetGroup[] = [];

  for (const parameter of FACET_PARAMETERS) {
    if (SCOPE_FACETS.has(parameter) && query.scope.kind === parameter) continue;

    // F-2: brand ranges only mean something once a brand is chosen. Shown on
    // `/shop`, `line` is a flat list of every range from every brand — thirty
    // values where "Ultra Lift" and "Platinum Line" sit side by side meaning
    // nothing, which is the one-product dead end the competitive research warns
    // about.
    if (parameter === "line" && !spansOneBrand(query)) continue;

    const others = Object.entries(clauses)
      .filter(([key, clause]) => key !== parameter && clause !== undefined)
      .map(([, clause]) => clause);

    const applied = new Set(query[LIST_PARAMETER_KEYS[parameter]]);
    const rows = await facetCounts(localeCode, parameter, and(...others));

    const options = rows
      .filter((row) => row.count > 0 || applied.has(row.slug))
      .map((row) => ({
        value: row.slug,
        label: row.name,
        count: Number(row.count),
        isApplied: applied.has(row.slug),
        href: facetToggleHref(query, parameter, row.slug),
      }));

    if (options.length > 0) groups.push({ parameter, options });
  }

  return groups;
}

/**
 * Display order, from the facet manifest F-1: concern first because it is the
 * axis this site competes on, then who the product is for, then brand and its
 * ranges, then type and routine position.
 */
const FACET_PARAMETERS = [
  "concern",
  "skin_type",
  "brand",
  "line",
  "category",
  "phase",
] as const;

const LIST_PARAMETER_KEYS = {
  brand: "brands",
  concern: "concerns",
  category: "categories",
  line: "lines",
  skin_type: "skinTypes",
  phase: "phases",
} as const;

/** Facet codes that are also route scopes, and so are never offered on their own page. */
const SCOPE_FACETS = new Set(["brand", "concern", "category"]);

/** One group's counts. Split out so `loadFacets` reads as the policy it is. */
async function facetCounts(
  localeCode: string,
  parameter: (typeof FACET_PARAMETERS)[number],
  where: ReturnType<typeof and>,
): Promise<readonly { slug: string; name: string; count: number }[]> {
  const productCount = sql<number>`count(distinct ${product.id})`;

  if (parameter === "brand") {
    return db
      .select({
        slug: brand.slug,
        name: brandTranslation.name,
        count: productCount,
      })
      .from(brand)
      .innerJoin(
        brandTranslation,
        and(
          eq(brandTranslation.brandId, brand.id),
          eq(brandTranslation.localeCode, localeCode),
        ),
      )
      .leftJoin(product, eq(product.brandId, brand.id))
      .where(where)
      .groupBy(brand.id, brand.slug, brand.sortOrder, brandTranslation.name)
      .orderBy(asc(brand.sortOrder), asc(brand.slug));
  }

  if (parameter === "category") {
    return db
      .select({
        slug: category.slug,
        name: categoryTranslation.name,
        count: productCount,
      })
      .from(category)
      .innerJoin(
        categoryTranslation,
        and(
          eq(categoryTranslation.categoryId, category.id),
          eq(categoryTranslation.localeCode, localeCode),
        ),
      )
      .leftJoin(product, eq(product.categoryId, category.id))
      .where(where)
      .groupBy(
        category.id,
        category.slug,
        category.sortOrder,
        categoryTranslation.name,
      )
      .orderBy(asc(category.sortOrder), asc(category.slug));
  }

  if (parameter === "line") {
    return db
      .select({
        slug: productLine.slug,
        name: productLineTranslation.name,
        count: productCount,
      })
      .from(productLine)
      .innerJoin(
        productLineTranslation,
        and(
          eq(productLineTranslation.productLineId, productLine.id),
          eq(productLineTranslation.localeCode, localeCode),
        ),
      )
      .leftJoin(product, eq(product.lineId, productLine.id))
      .where(where)
      .groupBy(
        productLine.id,
        productLine.slug,
        productLine.sortOrder,
        productLineTranslation.name,
      )
      .orderBy(asc(productLine.sortOrder), asc(productLine.slug));
  }

  if (parameter === "skin_type") {
    return db
      .select({
        slug: skinState.slug,
        name: skinStateTranslation.name,
        count: productCount,
      })
      .from(skinState)
      .innerJoin(
        skinStateTranslation,
        and(
          eq(skinStateTranslation.skinStateId, skinState.id),
          eq(skinStateTranslation.localeCode, localeCode),
        ),
      )
      .leftJoin(
        productSkinState,
        eq(productSkinState.skinStateId, skinState.id),
      )
      .leftJoin(product, eq(product.id, productSkinState.productId))
      .where(where)
      .groupBy(
        skinState.id,
        skinState.slug,
        skinState.sortOrder,
        skinStateTranslation.name,
      )
      .orderBy(asc(skinState.sortOrder), asc(skinState.slug));
  }

  if (parameter === "phase") {
    return db
      .select({
        slug: protocolPhase.slug,
        name: protocolPhaseTranslation.name,
        count: productCount,
      })
      .from(protocolPhase)
      .innerJoin(
        protocolPhaseTranslation,
        and(
          eq(protocolPhaseTranslation.protocolPhaseId, protocolPhase.id),
          eq(protocolPhaseTranslation.localeCode, localeCode),
        ),
      )
      .leftJoin(
        productProtocolPhase,
        eq(productProtocolPhase.protocolPhaseId, protocolPhase.id),
      )
      .leftJoin(product, eq(product.id, productProtocolPhase.productId))
      .where(where)
      .groupBy(
        protocolPhase.id,
        protocolPhase.slug,
        protocolPhase.sortOrder,
        protocolPhaseTranslation.name,
      )
      .orderBy(asc(protocolPhase.sortOrder), asc(protocolPhase.slug));
  }

  return db
    .select({
      slug: concern.slug,
      name: concernTranslation.name,
      count: productCount,
    })
    .from(concern)
    .innerJoin(
      concernTranslation,
      and(
        eq(concernTranslation.concernId, concern.id),
        eq(concernTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(productConcern, eq(productConcern.concernId, concern.id))
    .leftJoin(product, eq(product.id, productConcern.productId))
    .where(where)
    .groupBy(
      concern.id,
      concern.slug,
      concern.sortOrder,
      concernTranslation.name,
    )
    .orderBy(asc(concern.sortOrder), asc(concern.slug));
}

/**
 * The price range the current results actually span.
 *
 * Counted with the price bounds themselves removed, for the same reason facet
 * groups are — a slider whose ends move to whatever you last selected can only
 * narrow, and a customer cannot widen back out without clearing.
 *
 * Returns null when nothing in range carries an eligible price, so the control
 * is absent rather than offering a range of zero to zero.
 */
async function loadPriceBounds(
  query: CatalogueQuery,
  clauses: Readonly<Record<string, ReturnType<typeof and> | undefined>>,
  floor: ReturnType<typeof eligiblePriceFloor>,
): Promise<PriceFacet | null> {
  const others = Object.entries(clauses)
    .filter(
      ([key, clause]) =>
        key !== "minPrice" && key !== "maxPrice" && clause !== undefined,
    )
    .map(([, clause]) => clause);

  const [row] = await db
    .select({
      min: sql<string | null>`min(${floor})`,
      max: sql<string | null>`max(${floor})`,
    })
    .from(product)
    .where(and(...others));

  if (!row?.min || !row.max) return null;

  const minToman = Number(BigInt(row.min) / 10n);
  const maxToman = Number(BigInt(row.max) / 10n);
  if (minToman === maxToman) return null;

  return {
    minToman,
    maxToman,
    appliedMinToman:
      query.minPriceRials === null ? null : Number(query.minPriceRials / 10n),
    appliedMaxToman:
      query.maxPriceRials === null ? null : Number(query.maxPriceRials / 10n),
    // The form posts to the scope with every other filter preserved; the price
    // inputs supply their own values.
    action: catalogueHref({
      ...query,
      minPriceRials: null,
      maxPriceRials: null,
      page: 1,
    }),
  };
}

export async function listProducts(
  localeCode: string,
  scope: CatalogueScope,
  search: URLSearchParams,
  translate: Translate,
): Promise<StorefrontOutcome<ProductListingPage>> {
  const parsed = parseCatalogueQuery(scope, search);
  if (parsed.kind === "invalid") return invalidQuery(parsed.issues);
  if (parsed.kind === "redirect") {
    return redirect(catalogueHref(parsed.query));
  }

  const query = parsed.query;
  const scopeTitle = await resolveScopeTitle(
    localeCode,
    query.scope,
    translate,
  );
  if (scopeTitle === "not-found") return notFound();
  if (scopeTitle === "locale-unavailable") return localeUnavailable();

  const floor = eligiblePriceFloor(ANONYMOUS_GROUP);

  /**
   * The predicate, kept in named parts rather than pre-combined.
   *
   * Facet counting needs the same set of conditions *minus one group's own
   * selections* — PLP-03 — so the parts have to stay separable. Combining them
   * here and rebuilding a second predicate for the facets would be two
   * definitions of what this listing shows, and they would drift.
   */
  const clauses = {
    visible: visibleInLocale(localeCode),
    scope: scopePredicate(query.scope, localeCode),
    brand: slugFilter(query.brands, "brand", localeCode),
    category: slugFilter(query.categories, "category", localeCode),
    concern: slugFilter(query.concerns, "concern", localeCode),
    line: anySlugOf(query.lines, "line"),
    skin_type: anySlugOf(query.skinTypes, "skin_type"),
    phase: anySlugOf(query.phases, "phase"),
    audience: audiencePredicate(query.audience),
    inStock: query.inStockOnly ? inStockPredicate(ANONYMOUS_GROUP) : undefined,
    minPrice:
      query.minPriceRials !== null
        ? gte(floor, query.minPriceRials)
        : undefined,
    maxPrice:
      query.maxPriceRials !== null
        ? lte(floor, query.maxPriceRials)
        : undefined,
  } as const;

  const where = and(
    ...Object.values(clauses).filter((clause) => clause !== undefined),
  );
  const offset = (query.page - 1) * DEFAULT_PAGE_SIZE;

  const rows = await db
    .select({
      id: product.id,
      slug: product.slug,
      name: productTranslation.name,
      promise: productTranslation.promise,
      isProfessionalOnly: product.isProfessionalOnly,
      priceVisibility: product.priceVisibility,
      brandSlug: brand.slug,
      brandName: brandTranslation.name,
      total: sql<number>`count(*) over ()`,
    })
    .from(product)
    .innerJoin(
      productTranslation,
      and(
        eq(productTranslation.productId, product.id),
        eq(productTranslation.localeCode, localeCode),
      ),
    )
    .innerJoin(brand, eq(brand.id, product.brandId))
    .leftJoin(
      brandTranslation,
      and(
        eq(brandTranslation.brandId, brand.id),
        eq(brandTranslation.localeCode, localeCode),
      ),
    )
    .where(where)
    .orderBy(...orderBy(query.sort, floor))
    .limit(DEFAULT_PAGE_SIZE)
    .offset(offset);

  const total = rows[0] ? Number(rows[0].total) : 0;
  const tiles = await loadTiles(
    localeCode,
    rows.map((row) => ({ ...row, brandName: row.brandName ?? row.brandSlug })),
    ANONYMOUS_GROUP,
  );

  const pagination = buildPagination(query, {
    total,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const filters = appliedFilters(query);
  const facets = await loadFacets(localeCode, query, clauses);
  const price = await loadPriceBounds(query, clauses, floor);

  const sortOptions: readonly SortOption[] = SORTS.map((value) => ({
    value,
    href: catalogueHref({ ...query, sort: value, page: 1 }),
    isCurrent: value === query.sort,
  }));

  const isFilteredOrSorted =
    filters.length > 0 ||
    query.sort !== "featured" ||
    query.scope.kind === "search";

  return ready({
    scope: {
      kind: query.scope.kind,
      title: scopeTitle.title,
      introduction: scopeTitle.introduction,
    },
    breadcrumbs: scopeTitle.breadcrumbs,
    query,
    results: tiles,
    facets,
    appliedFilters: filters,
    clearFiltersHref:
      filters.length > 0
        ? catalogueHref({
            ...query,
            brands: [],
            concerns: [],
            categories: [],
            inStockOnly: false,
            minPriceRials: null,
            maxPriceRials: null,
            page: 1,
          })
        : null,
    sortOptions,
    price,
    // Absent until content exists. The structure ships so the copy has
    // somewhere to land — F-5.
    questions: [],
    pagination,
    meta: {
      title: scopeTitle.title,
      description: scopeTitle.introduction,
      canonicalPath: catalogueHref({
        ...query,
        brands: [],
        concerns: [],
        categories: [],
        inStockOnly: false,
        minPriceRials: null,
        maxPriceRials: null,
        sort: "featured",
      }),
      robots: isFilteredOrSorted ? "noindex,follow" : "index,follow",
    },
  });
}

type ScopeTitle =
  | "not-found"
  | "locale-unavailable"
  | {
      title: string;
      introduction: string | null;
      breadcrumbs: readonly { label: string; href: string }[];
    };

async function resolveScopeTitle(
  localeCode: string,
  scope: CatalogueScope,
  translate: Translate,
): Promise<ScopeTitle> {
  // Translated rather than hardcoded Persian. The same leak as `getShopHub`'s
  // metadata: copy inside a read that only ever spoke one language.
  const shopCrumb = { label: translate("shopCrumb"), href: "/shop" };

  if (scope.kind === "hub") {
    return {
      title: translate("allProducts.title"),
      introduction: translate("allProducts.introduction"),
      breadcrumbs: [
        shopCrumb,
        { label: translate("allProducts.title"), href: "/shop/all" },
      ],
    };
  }
  if (scope.kind === "search") {
    return {
      title: scope.query,
      introduction: null,
      breadcrumbs: [shopCrumb],
    };
  }

  const [table, translations, joinKey] =
    scope.kind === "brand"
      ? ([brand, brandTranslation, brandTranslation.brandId] as const)
      : scope.kind === "category"
        ? ([
            category,
            categoryTranslation,
            categoryTranslation.categoryId,
          ] as const)
        : ([
            concern,
            concernTranslation,
            concernTranslation.concernId,
          ] as const);

  const rows = await db
    .select({
      id: table.id,
      name: translations.name,
    })
    .from(table)
    .leftJoin(
      translations,
      and(eq(joinKey, table.id), eq(translations.localeCode, localeCode)),
    )
    .where(eq(table.slug, scope.slug))
    .limit(1);

  const row = rows[0];
  if (!row) return "not-found";
  if (row.name === null) return "locale-unavailable";

  return {
    title: row.name,
    introduction: null,
    breadcrumbs: [
      shopCrumb,
      {
        label: row.name,
        href: catalogueHref(emptyQuery(scope)),
      },
    ],
  };
}

/**
 * Resolves one message. The route supplies it from `getTranslations`.
 *
 * Injected rather than imported, because importing `next-intl/server` here
 * bound the read to the React server runtime: it could only be called from
 * inside an RSC render, and calling it from a test raised
 * "`getTranslations` is not supported in Client Components" — which is what
 * finding this cost. A read that cannot be called outside a render is a read
 * nobody can test.
 *
 * The copy still has one home. The route looks it up; the page model still
 * carries the finished string, so no screen translates its own title.
 */
export type Translate = (key: string) => string;

export async function getShopHub(
  localeCode: string,
  translate: Translate,
): Promise<StorefrontOutcome<ShopHubPage>> {
  const visible = visibleInLocale(localeCode);

  const countFor = (joinCondition: ReturnType<typeof and>) =>
    sql<number>`(
      select count(*) from ${product}
      where ${and(visible, joinCondition)}
    )`;

  const concerns = await db
    .select({
      slug: concern.slug,
      name: concernTranslation.name,
      description: concernTranslation.description,
      sortOrder: concern.sortOrder,
      productCount: countFor(
        exists(
          db
            .select({ one: sql`1` })
            .from(productConcern)
            .where(
              and(
                eq(productConcern.productId, product.id),
                eq(productConcern.concernId, concern.id),
              ),
            ),
        ),
      ),
    })
    .from(concern)
    .innerJoin(
      concernTranslation,
      and(
        eq(concernTranslation.concernId, concern.id),
        eq(concernTranslation.localeCode, localeCode),
      ),
    )
    .orderBy(asc(concern.sortOrder), asc(concern.slug));

  const brands = await db
    .select({
      slug: brand.slug,
      name: brandTranslation.name,
      countryCode: brand.countryCode,
      productCount: countFor(eq(product.brandId, brand.id)),
    })
    .from(brand)
    .innerJoin(
      brandTranslation,
      and(
        eq(brandTranslation.brandId, brand.id),
        eq(brandTranslation.localeCode, localeCode),
      ),
    )
    .orderBy(asc(brand.sortOrder), asc(brand.slug));

  const categories = await db
    .select({
      slug: category.slug,
      name: categoryTranslation.name,
      productCount: countFor(eq(product.categoryId, category.id)),
    })
    .from(category)
    .innerJoin(
      categoryTranslation,
      and(
        eq(categoryTranslation.categoryId, category.id),
        eq(categoryTranslation.localeCode, localeCode),
      ),
    )
    .orderBy(asc(category.sortOrder), asc(category.slug));

  const featuredRows = await db
    .select({
      id: product.id,
      slug: product.slug,
      name: productTranslation.name,
      promise: productTranslation.promise,
      isProfessionalOnly: product.isProfessionalOnly,
      priceVisibility: product.priceVisibility,
      brandSlug: brand.slug,
      brandName: brandTranslation.name,
    })
    .from(product)
    .innerJoin(
      productTranslation,
      and(
        eq(productTranslation.productId, product.id),
        eq(productTranslation.localeCode, localeCode),
      ),
    )
    .innerJoin(brand, eq(brand.id, product.brandId))
    .leftJoin(
      brandTranslation,
      and(
        eq(brandTranslation.brandId, brand.id),
        eq(brandTranslation.localeCode, localeCode),
      ),
    )
    .where(visible)
    .orderBy(asc(product.merchandisingRank), asc(product.id))
    .limit(HUB_FEATURED_LIMIT);

  const featured = await loadTiles(
    localeCode,
    featuredRows.map((row) => ({
      ...row,
      brandName: row.brandName ?? row.brandSlug,
    })),
    ANONYMOUS_GROUP,
  );

  const hubHref = "/shop";

  const hubConcerns = concerns
    .filter((row) => row.productCount > 0)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      href: `${hubHref}/concern/${row.slug}`,
      productCount: Number(row.productCount),
    }));

  const concernSpotlights = await loadConcernSpotlights(
    localeCode,
    hubConcerns.slice(0, HUB_SPOTLIGHT_CONCERNS),
    visible,
  );

  return ready({
    concerns: hubConcerns,
    concernSpotlights,
    brands: brands
      .filter((row) => row.productCount > 0)
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        countryCode: row.countryCode,
        href: `${hubHref}/brand/${row.slug}`,
        productCount: Number(row.productCount),
      })),
    categories: categories
      .filter((row) => row.productCount > 0)
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        href: `${hubHref}/c/${row.slug}`,
        productCount: Number(row.productCount),
      })),
    featured,
    searchHref: `${hubHref}/search`,
    meta: {
      // Copy resolved here, not in the route: the page model is the one
      // presentation-ready shape, and a route that translates its own title
      // would be a second place for the hub's name to live.
      title: translate("meta.title"),
      description: translate("meta.description"),
      canonicalPath: hubHref,
      robots: "index,follow",
    },
  });
}

export async function getProduct(
  localeCode: string,
  slug: string,
  selectedVariantId?: string,
): Promise<StorefrontOutcome<ProductDetailPage>> {
  const rows = await db
    .select({
      id: product.id,
      slug: product.slug,
      isPublished: product.isPublished,
      reviewState: product.reviewState,
      isProfessionalOnly: product.isProfessionalOnly,
      priceVisibility: product.priceVisibility,
      brandSlug: brand.slug,
      brandCountry: brand.countryCode,
      brandName: brandTranslation.name,
      categorySlug: category.slug,
      categoryName: categoryTranslation.name,
      name: productTranslation.name,
      promise: productTranslation.promise,
      description: productTranslation.description,
      ingredients: productTranslation.ingredients,
      usage: productTranslation.usage,
      suitableFor: productTranslation.suitableFor,
    })
    .from(product)
    .innerJoin(brand, eq(brand.id, product.brandId))
    .leftJoin(
      brandTranslation,
      and(
        eq(brandTranslation.brandId, brand.id),
        eq(brandTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(category, eq(category.id, product.categoryId))
    .leftJoin(
      categoryTranslation,
      and(
        eq(categoryTranslation.categoryId, category.id),
        eq(categoryTranslation.localeCode, localeCode),
      ),
    )
    .leftJoin(
      productTranslation,
      and(
        eq(productTranslation.productId, product.id),
        eq(productTranslation.localeCode, localeCode),
      ),
    )
    .where(eq(product.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) return notFound();

  // An unpublished product is not-found rather than locale-unavailable: from
  // outside, it does not exist at all.
  if (
    !resolveCataloguePreview().previewDrafts &&
    (!row.isPublished || row.reviewState !== "approved")
  ) {
    return notFound();
  }
  if (row.name === null) return localeUnavailable();

  const variantRows = await db
    .select({
      id: variant.id,
      sku: variant.sku,
      isActive: variant.isActive,
      sizeLabel: variantTranslation.sizeLabel,
      onHand: sql<number>`coalesce(${inventory.onHand}, 0)`,
      amountRials: price.amountRials,
      customerGroup: price.customerGroup,
    })
    .from(variant)
    .leftJoin(inventory, eq(inventory.variantId, variant.id))
    .leftJoin(price, eq(price.variantId, variant.id))
    .leftJoin(
      variantTranslation,
      and(
        eq(variantTranslation.variantId, variant.id),
        eq(variantTranslation.localeCode, localeCode),
      ),
    )
    .where(eq(variant.productId, row.id));

  if (!variantRows.some((entry) => entry.isActive)) return notFound();

  const grouped = new Map<
    string,
    {
      id: string;
      sku: string;
      sizeLabel: string | null;
      isActive: boolean;
      onHand: number;
      prices: { customerGroup: CustomerGroup; amountRials: bigint }[];
    }
  >();
  for (const entry of variantRows) {
    const existing = grouped.get(entry.id) ?? {
      id: entry.id,
      sku: entry.sku,
      sizeLabel: entry.sizeLabel,
      isActive: entry.isActive,
      onHand: Number(entry.onHand),
      prices: [],
    };
    if (entry.amountRials !== null && entry.customerGroup !== null) {
      existing.prices.push({
        customerGroup: entry.customerGroup as CustomerGroup,
        amountRials: entry.amountRials,
      });
    }
    grouped.set(entry.id, existing);
  }
  const variants = [...grouped.values()];

  const offer = resolveOfferState({
    isProfessionalOnly: row.isProfessionalOnly,
    priceVisibility: row.priceVisibility,
    customerGroup: ANONYMOUS_GROUP,
    variants,
    selectedVariantId,
  });

  const mediaRows = await db
    .select({
      key: productMedia.detailObjectKey,
      width: productMedia.width,
      height: productMedia.height,
      sortOrder: productMedia.sortOrder,
      alt: productMediaTranslation.altText,
    })
    .from(productMedia)
    .leftJoin(
      productMediaTranslation,
      and(
        eq(productMediaTranslation.productMediaId, productMedia.id),
        eq(productMediaTranslation.localeCode, localeCode),
      ),
    )
    .where(eq(productMedia.productId, row.id))
    .orderBy(asc(productMedia.sortOrder), asc(productMedia.id));

  const concernRows = await db
    .select({ slug: concern.slug, name: concernTranslation.name })
    .from(productConcern)
    .innerJoin(concern, eq(concern.id, productConcern.concernId))
    .innerJoin(
      concernTranslation,
      and(
        eq(concernTranslation.concernId, concern.id),
        eq(concernTranslation.localeCode, localeCode),
      ),
    )
    .where(eq(productConcern.productId, row.id))
    .orderBy(asc(concern.sortOrder));

  const eligible = variants
    .filter((entry) => entry.isActive)
    .flatMap((entry) =>
      entry.prices
        .filter((item) => item.customerGroup === ANONYMOUS_GROUP)
        .map((item) => item.amountRials),
    );
  const floor =
    eligible.length > 0 ? eligible.reduce((a, b) => (a < b ? a : b)) : null;

  const detailHref = `/shop/p/${row.slug}`;
  const brandName = row.brandName ?? row.brandSlug;

  return ready({
    slug: row.slug,
    name: row.name,
    promise: row.promise,
    description: row.description,
    ingredients: row.ingredients,
    usage: row.usage,
    suitableFor: row.suitableFor,
    brand: {
      slug: row.brandSlug,
      name: brandName,
      href: `/shop/brand/${row.brandSlug}`,
      countryCode: row.brandCountry,
    },
    category:
      row.categorySlug && row.categoryName
        ? {
            slug: row.categorySlug,
            name: row.categoryName,
            href: `/shop/c/${row.categorySlug}`,
          }
        : null,
    concerns: concernRows.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      href: `/shop/concern/${entry.slug}`,
    })),
    media: mediaRows
      .filter(
        (entry): entry is typeof entry & { key: string } => entry.key !== null,
      )
      .map((entry) => ({
        src: entry.key,
        alt: entry.alt ?? row.name ?? row.slug,
        width: entry.width,
        height: entry.height,
      })),
    variants: variants.map((entry) => {
      const price = entry.prices.find(
        (item) => item.customerGroup === ANONYMOUS_GROUP,
      );
      return {
        id: entry.id,
        sku: entry.sku,
        sizeLabel: entry.sizeLabel,
        isAvailable: entry.isActive && entry.onHand > 0 && price !== undefined,
        price:
          row.priceVisibility === "on_request"
            ? null
            : priceView(price?.amountRials ?? null, localeCode),
        href: `${detailHref}?variant=${entry.id}`,
      };
    }),
    offer,
    price:
      row.priceVisibility === "on_request"
        ? null
        : priceView(floor, localeCode),
    breadcrumbs: [
      { label: "فروشگاه", href: `/shop` },
      { label: brandName, href: `/shop/brand/${row.brandSlug}` },
      { label: row.name, href: detailHref },
    ],
    meta: {
      title: row.name,
      description: row.promise,
      canonicalPath: detailHref,
      robots: "index,follow",
    },
  });
}
