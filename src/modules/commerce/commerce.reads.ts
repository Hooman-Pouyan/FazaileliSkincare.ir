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
import { getTranslations } from "next-intl/server";
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
  productMedia,
  productMediaTranslation,
  productTranslation,
  variant,
  variantTranslation,
} from "@/lib/db/schema";
import { formatToman } from "@/lib/money";
import {
  type CatalogueQuery,
  type CatalogueScope,
  type CatalogueSort,
  catalogueHref,
  parseCatalogueQuery,
} from "./models/catalogue-query";
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
function visibleInLocale(localeCode: string) {
  return and(
    eq(product.isPublished, true),
    eq(product.reviewState, "approved"),
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

export async function listProducts(
  localeCode: string,
  scope: CatalogueScope,
  search: URLSearchParams,
): Promise<StorefrontOutcome<ProductListingPage>> {
  const parsed = parseCatalogueQuery(scope, search);
  if (parsed.kind === "invalid") return invalidQuery(parsed.issues);
  if (parsed.kind === "redirect") {
    return redirect(catalogueHref(parsed.query));
  }

  const query = parsed.query;
  const scopeTitle = await resolveScopeTitle(localeCode, query.scope);
  if (scopeTitle === "not-found") return notFound();
  if (scopeTitle === "locale-unavailable") return localeUnavailable();

  const floor = eligiblePriceFloor(ANONYMOUS_GROUP);
  const conditions = [
    visibleInLocale(localeCode),
    scopePredicate(query.scope, localeCode),
    slugFilter(query.brands, "brand", localeCode),
    slugFilter(query.categories, "category", localeCode),
    slugFilter(query.concerns, "concern", localeCode),
    query.inStockOnly ? inStockPredicate(ANONYMOUS_GROUP) : undefined,
    query.minPriceRials !== null ? gte(floor, query.minPriceRials) : undefined,
    query.maxPriceRials !== null ? lte(floor, query.maxPriceRials) : undefined,
  ].filter((clause) => clause !== undefined);

  const where = and(...conditions);
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

  const pagination = buildPagination(localeCode, query, {
    total,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const filters = appliedFilters(localeCode, query);

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
    // Facet counts are not built here. PLP-03 requires each group's counts to be
    // computed with that group's own selections removed, which is a separate
    // query per group; it lands with the facet rail in the listing slice that
    // renders it. Returning an empty array is deliberate and visible rather than
    // a silently truncated set.
    facets: [],
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
): Promise<ScopeTitle> {
  const shopCrumb = { label: "فروشگاه", href: `/shop` };

  if (scope.kind === "hub") {
    return { title: "فروشگاه", introduction: null, breadcrumbs: [shopCrumb] };
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
        href: catalogueHref({
          scope,
          brands: [],
          concerns: [],
          categories: [],
          inStockOnly: false,
          minPriceRials: null,
          maxPriceRials: null,
          sort: "featured",
          page: 1,
        } as CatalogueQuery),
      },
    ],
  };
}

export async function getShopHub(
  localeCode: string,
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
  const t = await getTranslations({ locale: localeCode, namespace: "shop" });

  return ready({
    concerns: concerns
      .filter((row) => row.productCount > 0)
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
        href: `${hubHref}/concern/${row.slug}`,
        productCount: Number(row.productCount),
      })),
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
      title: t("meta.title"),
      description: t("meta.description"),
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
  if (!row.isPublished || row.reviewState !== "approved") return notFound();
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
