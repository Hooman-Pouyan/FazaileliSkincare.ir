/**
 * Iranian provinces and their administrative centres.
 *
 * **Source, recorded because reference data without a provenance is
 * indistinguishable from invention:** the province set and its codes are
 * ISO 3166-2:IR — the thirty-one provinces as constituted after the 2004
 * division of Khorasan into three. The Persian names are the official forms;
 * the Latin names are the ISO romanisations.
 *
 * **The city set is deliberately partial and says so.** It holds one city per
 * province — the administrative centre — and nothing else. Iran has well over a
 * thousand recognised cities, and reconstructing that list from memory would be
 * exactly the invention `AGENTS.md` forbids: a city that does not exist, or a
 * city assigned to the wrong province, is a delivery address that fails at the
 * post office rather than in a test.
 *
 * `isCapital` is what makes the gap legible. A province showing one city is
 * incomplete, not single-city, and a query can find every such province in one
 * predicate the day a full dataset arrives.
 *
 * **Needs the maintainer:** an authoritative city list. The National
 * Organization for Civil Registration and Iran Post both publish one; which to
 * use is a decision about what a courier will accept, not a technical choice.
 */

export type ProvinceSeed = Readonly<{
  code: string;
  nameFa: string;
  nameEn: string;
  capitalFa: string;
  capitalEn: string;
}>;

export const IRAN_PROVINCES: readonly ProvinceSeed[] = [
  { code: "00", nameFa: "مرکزی", nameEn: "Markazi", capitalFa: "اراک", capitalEn: "Arak" },
  { code: "01", nameFa: "گیلان", nameEn: "Gilan", capitalFa: "رشت", capitalEn: "Rasht" },
  { code: "02", nameFa: "مازندران", nameEn: "Mazandaran", capitalFa: "ساری", capitalEn: "Sari" },
  { code: "03", nameFa: "آذربایجان شرقی", nameEn: "East Azerbaijan", capitalFa: "تبریز", capitalEn: "Tabriz" },
  { code: "04", nameFa: "آذربایجان غربی", nameEn: "West Azerbaijan", capitalFa: "ارومیه", capitalEn: "Urmia" },
  { code: "05", nameFa: "کرمانشاه", nameEn: "Kermanshah", capitalFa: "کرمانشاه", capitalEn: "Kermanshah" },
  { code: "06", nameFa: "خوزستان", nameEn: "Khuzestan", capitalFa: "اهواز", capitalEn: "Ahvaz" },
  { code: "07", nameFa: "فارس", nameEn: "Fars", capitalFa: "شیراز", capitalEn: "Shiraz" },
  { code: "08", nameFa: "کرمان", nameEn: "Kerman", capitalFa: "کرمان", capitalEn: "Kerman" },
  { code: "09", nameFa: "خراسان رضوی", nameEn: "Razavi Khorasan", capitalFa: "مشهد", capitalEn: "Mashhad" },
  { code: "10", nameFa: "اصفهان", nameEn: "Isfahan", capitalFa: "اصفهان", capitalEn: "Isfahan" },
  { code: "11", nameFa: "سیستان و بلوچستان", nameEn: "Sistan and Baluchestan", capitalFa: "زاهدان", capitalEn: "Zahedan" },
  { code: "12", nameFa: "کردستان", nameEn: "Kurdistan", capitalFa: "سنندج", capitalEn: "Sanandaj" },
  { code: "13", nameFa: "همدان", nameEn: "Hamadan", capitalFa: "همدان", capitalEn: "Hamadan" },
  { code: "14", nameFa: "چهارمحال و بختیاری", nameEn: "Chaharmahal and Bakhtiari", capitalFa: "شهرکرد", capitalEn: "Shahrekord" },
  { code: "15", nameFa: "لرستان", nameEn: "Lorestan", capitalFa: "خرم‌آباد", capitalEn: "Khorramabad" },
  { code: "16", nameFa: "ایلام", nameEn: "Ilam", capitalFa: "ایلام", capitalEn: "Ilam" },
  { code: "17", nameFa: "کهگیلویه و بویراحمد", nameEn: "Kohgiluyeh and Boyer-Ahmad", capitalFa: "یاسوج", capitalEn: "Yasuj" },
  { code: "18", nameFa: "بوشهر", nameEn: "Bushehr", capitalFa: "بوشهر", capitalEn: "Bushehr" },
  { code: "19", nameFa: "زنجان", nameEn: "Zanjan", capitalFa: "زنجان", capitalEn: "Zanjan" },
  { code: "20", nameFa: "سمنان", nameEn: "Semnan", capitalFa: "سمنان", capitalEn: "Semnan" },
  { code: "21", nameFa: "یزد", nameEn: "Yazd", capitalFa: "یزد", capitalEn: "Yazd" },
  { code: "22", nameFa: "هرمزگان", nameEn: "Hormozgan", capitalFa: "بندرعباس", capitalEn: "Bandar Abbas" },
  { code: "23", nameFa: "تهران", nameEn: "Tehran", capitalFa: "تهران", capitalEn: "Tehran" },
  { code: "24", nameFa: "اردبیل", nameEn: "Ardabil", capitalFa: "اردبیل", capitalEn: "Ardabil" },
  { code: "25", nameFa: "قم", nameEn: "Qom", capitalFa: "قم", capitalEn: "Qom" },
  { code: "26", nameFa: "قزوین", nameEn: "Qazvin", capitalFa: "قزوین", capitalEn: "Qazvin" },
  { code: "27", nameFa: "گلستان", nameEn: "Golestan", capitalFa: "گرگان", capitalEn: "Gorgan" },
  { code: "28", nameFa: "خراسان شمالی", nameEn: "North Khorasan", capitalFa: "بجنورد", capitalEn: "Bojnurd" },
  { code: "29", nameFa: "خراسان جنوبی", nameEn: "South Khorasan", capitalFa: "بیرجند", capitalEn: "Birjand" },
  { code: "30", nameFa: "البرز", nameEn: "Alborz", capitalFa: "کرج", capitalEn: "Karaj" },
] as const;
