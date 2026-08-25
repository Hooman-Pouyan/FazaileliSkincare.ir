/**
 * Fictional development catalogue.
 *
 * Every brand, product, price and stock figure below is invented. Nothing here
 * describes a real Storyderm, Forlle'd or Thalgo product, and nothing here may
 * ever be promoted to catalogue truth — `14-storyderm-draft-catalog-pipeline.md`
 * is explicit that prices, SKUs, stock, claims and sellable boundaries are not
 * inferred, and this file does not weaken that. Its only job is to give the
 * storefront routes something to render so the product can be judged.
 *
 * The names say so in Persian: نمونه means "sample". Every slug and SKU carries
 * a `dev-` / `DEV-` prefix, which the seeder uses as its safety check.
 *
 * The set is chosen to cover every offer and publication state a route must
 * handle, including the states that must NOT appear in the catalogue.
 */

export const DEV_SLUG_PREFIX = "dev-";
export const DEV_SKU_PREFIX = "DEV-";

export const DEV_BRANDS = [
  {
    slug: "dev-brand-alef",
    countryCode: "KR",
    isOfficialRepresentative: true,
    sortOrder: 10,
    translations: [
      { localeCode: "fa", name: "برند نمونه الف" },
      { localeCode: "en", name: "Sample Brand Alef" },
    ],
    lines: [
      {
        slug: "dev-line-roshana",
        sortOrder: 10,
        translations: [
          { localeCode: "fa", name: "سری روشنا" },
          { localeCode: "en", name: "Roshana line" },
        ],
      },
    ],
  },
  {
    slug: "dev-brand-be",
    countryCode: "FR",
    isOfficialRepresentative: false,
    sortOrder: 20,
    translations: [
      { localeCode: "fa", name: "برند نمونه ب" },
      { localeCode: "en", name: "Sample Brand Be" },
    ],
    lines: [],
  },
  {
    slug: "dev-brand-jim",
    countryCode: "JP",
    isOfficialRepresentative: false,
    sortOrder: 30,
    translations: [
      { localeCode: "fa", name: "برند نمونه ج" },
      { localeCode: "en", name: "Sample Brand Jim" },
    ],
    lines: [],
  },
] as const;

export const DEV_CATEGORIES = [
  {
    slug: "dev-cleanser",
    sortOrder: 10,
    translations: [
      { localeCode: "fa", name: "پاک‌کننده" },
      { localeCode: "en", name: "Cleanser" },
    ],
  },
  {
    slug: "dev-serum",
    sortOrder: 20,
    translations: [
      { localeCode: "fa", name: "سرم" },
      { localeCode: "en", name: "Serum" },
    ],
  },
  {
    slug: "dev-moisturiser",
    sortOrder: 30,
    translations: [
      { localeCode: "fa", name: "مرطوب‌کننده" },
      { localeCode: "en", name: "Moisturiser" },
    ],
  },
] as const;

/**
 * `expectation` is what a correct catalogue read must do with the row. It is
 * asserted by the DB3 read-model fixtures, so a policy regression fails a test
 * rather than quietly changing what a customer sees.
 */
export const DEV_PRODUCTS = [
  {
    slug: "dev-product-1-shosto-roshana",
    brandSlug: "dev-brand-alef",
    lineSlug: "dev-line-roshana",
    categorySlug: "dev-cleanser",
    concernSlugs: ["hydration", "barrier"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 10,
    expectation: "purchasable",
    translations: [
      {
        localeCode: "fa",
        name: "شوینده نمونه روشنا",
        promise: "نمونهٔ توسعه — این متن جای توضیح واقعی محصول را می‌گیرد.",
        description:
          "این محصول واقعی نیست و فقط برای آزمودن صفحه‌ها ساخته شده است.",
      },
      {
        localeCode: "en",
        name: "Roshana sample cleanser",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-1-200ML",
        sizeValue: "200.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 24,
        prices: [{ customerGroup: "public", amountRials: 4_800_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "sand",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-2-serum-shabnam",
    brandSlug: "dev-brand-alef",
    lineSlug: "dev-line-roshana",
    categorySlug: "dev-serum",
    concernSlugs: ["lak", "aging"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 20,
    expectation: "purchasable-multi-variant",
    translations: [
      {
        localeCode: "fa",
        name: "سرم نمونه شبنم",
        promise: "نمونهٔ توسعه — دو اندازه دارد تا انتخاب واریانت آزموده شود.",
      },
      {
        localeCode: "en",
        name: "Shabnam sample serum",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-2-30ML",
        sizeValue: "30.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 12,
        prices: [{ customerGroup: "public", amountRials: 9_200_000n }],
      },
      {
        sku: "DEV-2-50ML",
        sizeValue: "50.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 4,
        prices: [{ customerGroup: "public", amountRials: 13_500_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "lapis",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-3-krem-mahtab",
    brandSlug: "dev-brand-be",
    lineSlug: null,
    categorySlug: "dev-moisturiser",
    concernSlugs: ["barrier", "hydration"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 30,
    expectation: "out-of-stock",
    translations: [
      {
        localeCode: "fa",
        name: "کرم نمونه مهتاب",
        promise: "نمونهٔ توسعه — موجودی صفر، برای آزمودن حالت ناموجود.",
      },
      {
        localeCode: "en",
        name: "Mahtab sample cream",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-3-50ML",
        sizeValue: "50.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 0,
        prices: [{ customerGroup: "public", amountRials: 7_100_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "champagne",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-4-mask-parniyan",
    brandSlug: "dev-brand-be",
    lineSlug: null,
    categorySlug: "dev-serum",
    concernSlugs: ["acne"],
    isProfessionalOnly: false,
    priceVisibility: "on_request",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 40,
    expectation: "on-request-not-purchasable",
    translations: [
      {
        localeCode: "fa",
        name: "ماسک نمونه پرنیان",
        promise: "نمونهٔ توسعه — قیمت با استعلام، نباید به سبد افزوده شود.",
      },
      {
        localeCode: "en",
        name: "Parniyan sample mask",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-4-KIT",
        sizeValue: "1.00",
        sizeUnit: "kit",
        isActive: true,
        onHand: 8,
        prices: [],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "sand",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-5-peeling-atrisa",
    brandSlug: "dev-brand-jim",
    lineSlug: null,
    categorySlug: "dev-serum",
    concernSlugs: ["lak", "acne"],
    isProfessionalOnly: true,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 50,
    expectation: "professional-only-not-purchasable",
    translations: [
      {
        localeCode: "fa",
        name: "لایه‌بردار نمونه آتریسا",
        promise: "نمونهٔ توسعه — مخصوص متخصص، نباید برای عموم قابل خرید باشد.",
      },
      {
        localeCode: "en",
        name: "Atrisa sample peel",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-5-100ML",
        sizeValue: "100.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 6,
        prices: [{ customerGroup: "professional", amountRials: 18_400_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "lapis",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-6-tonik-baran",
    brandSlug: "dev-brand-jim",
    lineSlug: null,
    categorySlug: "dev-cleanser",
    concernSlugs: ["hydration"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 60,
    expectation: "no-active-variant-not-purchasable",
    translations: [
      {
        localeCode: "fa",
        name: "تونیک نمونه باران",
        promise: "نمونهٔ توسعه — هیچ واریانت فعالی ندارد.",
      },
      {
        localeCode: "en",
        name: "Baran sample tonic",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-6-150ML",
        sizeValue: "150.00",
        sizeUnit: "ml",
        isActive: false,
        onHand: 9,
        prices: [{ customerGroup: "public", amountRials: 3_300_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "champagne",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-7-english-only-cream",
    brandSlug: "dev-brand-jim",
    lineSlug: null,
    categorySlug: "dev-moisturiser",
    concernSlugs: ["aging"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 70,
    expectation: "absent-from-fa-catalogue",
    translations: [
      {
        localeCode: "en",
        name: "English-only sample cream",
        promise: "Development sample with no Persian translation.",
      },
    ],
    variants: [
      {
        sku: "DEV-7-50ML",
        sizeValue: "50.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 5,
        prices: [{ customerGroup: "public", amountRials: 6_600_000n }],
      },
    ],
    media: [
      {
        role: "primary",
        tone: "sand",
        sortOrder: 0,
        provenance: "supplier_draft",
        rights: "unknown",
      },
    ],
  },
  {
    slug: "dev-product-8-draft-never-visible",
    brandSlug: "dev-brand-alef",
    lineSlug: null,
    categorySlug: "dev-serum",
    concernSlugs: ["acne"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "draft",
    isPublished: false,
    merchandisingRank: 80,
    expectation: "absent-from-catalogue",
    translations: [
      {
        localeCode: "fa",
        name: "پیش‌نویس نمونه — نباید دیده شود",
        promise: "اگر این را در فروشگاه دیدید، فیلتر انتشار خراب است.",
      },
      { localeCode: "en", name: "Draft sample — must never render" },
    ],
    variants: [
      {
        sku: "DEV-8-30ML",
        sizeValue: "30.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 3,
        prices: [{ customerGroup: "public", amountRials: 5_000_000n }],
      },
    ],
    media: [],
  },
  {
    slug: "dev-product-9-verified-not-published",
    brandSlug: "dev-brand-be",
    lineSlug: null,
    categorySlug: "dev-cleanser",
    concernSlugs: ["barrier"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "verified",
    isPublished: false,
    merchandisingRank: 90,
    expectation: "absent-from-catalogue",
    translations: [
      { localeCode: "fa", name: "بازبینی‌شده اما منتشرنشده — نباید دیده شود" },
      {
        localeCode: "en",
        name: "Verified but unpublished — must never render",
      },
    ],
    variants: [
      {
        sku: "DEV-9-200ML",
        sizeValue: "200.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 7,
        prices: [{ customerGroup: "public", amountRials: 4_200_000n }],
      },
    ],
    media: [],
  },
  {
    slug: "dev-product-10-no-media",
    brandSlug: "dev-brand-alef",
    lineSlug: null,
    categorySlug: "dev-moisturiser",
    concernSlugs: ["hydration", "aging"],
    isProfessionalOnly: false,
    priceVisibility: "public",
    reviewState: "approved",
    isPublished: true,
    merchandisingRank: 100,
    expectation: "purchasable-without-media",
    translations: [
      {
        localeCode: "fa",
        name: "کرم نمونه بدون تصویر",
        promise:
          "نمونهٔ توسعه — هیچ تصویری ندارد، برای آزمودن حالت جای‌خالی تصویر.",
      },
      {
        localeCode: "en",
        name: "Sample cream without media",
        promise: "Development sample.",
      },
    ],
    variants: [
      {
        sku: "DEV-10-50ML",
        sizeValue: "50.00",
        sizeUnit: "ml",
        isActive: true,
        onHand: 15,
        prices: [{ customerGroup: "public", amountRials: 5_900_000n }],
      },
    ],
    media: [],
  },
] as const;

export type DevProduct = (typeof DEV_PRODUCTS)[number];
export type DevExpectation = DevProduct["expectation"];
