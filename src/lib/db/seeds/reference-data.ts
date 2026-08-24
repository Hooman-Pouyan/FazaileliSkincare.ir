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
