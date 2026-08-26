export const REFERENCE_LOCALES = [
  { code: "fa", direction: "rtl", isPrimary: true, isActive: true },
  { code: "en", direction: "ltr", isPrimary: false, isActive: true },
  { code: "ar", direction: "rtl", isPrimary: false, isActive: true },
] as const;

export const REFERENCE_CONCERNS = [
  {
    slug: "lak",
    sortOrder: 10,
    translations: [
      { localeCode: "fa", name: "لک" },
      { localeCode: "en", name: "Pigmentation" },
    ],
  },
  {
    slug: "acne",
    sortOrder: 20,
    translations: [
      { localeCode: "fa", name: "جوش و آکنه" },
      { localeCode: "en", name: "Acne" },
    ],
  },
  {
    slug: "hydration",
    sortOrder: 30,
    translations: [
      { localeCode: "fa", name: "آبرسانی" },
      { localeCode: "en", name: "Hydration" },
    ],
  },
  {
    slug: "barrier",
    sortOrder: 40,
    translations: [
      { localeCode: "fa", name: "ترمیم سد پوستی" },
      { localeCode: "en", name: "Barrier repair" },
    ],
  },
  {
    slug: "aging",
    sortOrder: 50,
    translations: [
      { localeCode: "fa", name: "ضدپیری" },
      { localeCode: "en", name: "Age support" },
    ],
  },
] as const;

/**
 * Skin states — the `skin_type` facet in `docs/24-facet-manifest.md` F-1.
 *
 * Persian and English only, like the concerns above: Arabic catalogue
 * vocabulary has not been reviewed, and `reference-data.test.ts` says so in the
 * name of the test that guards it. Under the exact-locale rule that means these
 * facets are absent on `/ar` — correct, and visible, rather than invented.
 *
 * Five states, because that is what the practice actually distinguishes and
 * what every competitor in `08-competitive-research.md` lists. More would be
 * facet maximalism: the design system's own `FacetRail` note warns that on ~60
 * SKUs one filter per value returns one product, which is worse than no filter.
 */
export const REFERENCE_SKIN_STATES = [
  {
    slug: "dry",
    sortOrder: 10,
    translations: [
      { localeCode: "fa", name: "خشک" },
      { localeCode: "en", name: "Dry" },
    ],
  },
  {
    slug: "oily",
    sortOrder: 20,
    translations: [
      { localeCode: "fa", name: "چرب" },
      { localeCode: "en", name: "Oily" },
    ],
  },
  {
    slug: "combination",
    sortOrder: 30,
    translations: [
      { localeCode: "fa", name: "مختلط" },
      { localeCode: "en", name: "Combination" },
    ],
  },
  {
    slug: "sensitive",
    sortOrder: 40,
    translations: [
      { localeCode: "fa", name: "حساس" },
      { localeCode: "en", name: "Sensitive" },
    ],
  },
  {
    slug: "normal",
    sortOrder: 50,
    translations: [
      { localeCode: "fa", name: "معمولی" },
      { localeCode: "en", name: "Normal" },
    ],
  },
] as const;

/**
 * The daily-care protocol and its phases — the `phase` facet.
 *
 * A phase says where a product sits in a routine, which is the question a
 * customer building one actually has: "I have a cleanser and a moisturiser,
 * what goes between them?" `08-competitive-research.md` lists routine role as
 * *differentiating* rather than expected, and it is the axis this practice can
 * answer better than a marketplace can.
 *
 * One protocol for now. `protocol_phase` is unique on `(protocolId, slug)`, so
 * a second protocol with its own "treat" phase would make `?phase=treat`
 * ambiguous — at that point the facet has to be scoped to a protocol. Recorded
 * rather than pre-built.
 */
export const REFERENCE_PROTOCOL = {
  slug: "daily-care",
  translations: [
    { localeCode: "fa", name: "مراقبت روزانه" },
    { localeCode: "en", name: "Daily care" },
  ],
  phases: [
    {
      slug: "cleanse",
      sortOrder: 10,
      translations: [
        { localeCode: "fa", name: "پاک‌سازی" },
        { localeCode: "en", name: "Cleanse" },
      ],
    },
    {
      slug: "treat",
      sortOrder: 20,
      translations: [
        { localeCode: "fa", name: "درمان" },
        { localeCode: "en", name: "Treat" },
      ],
    },
    {
      slug: "hydrate",
      sortOrder: 30,
      translations: [
        { localeCode: "fa", name: "آبرسانی و تغذیه" },
        { localeCode: "en", name: "Hydrate" },
      ],
    },
    {
      slug: "protect",
      sortOrder: 40,
      translations: [
        { localeCode: "fa", name: "محافظت" },
        { localeCode: "en", name: "Protect" },
      ],
    },
  ],
} as const;
