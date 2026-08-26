/**
 * Seeded editorial content — `CONTENT3`.
 *
 * Every block below is `reviewState: "draft"` with `authorNote:
 * "unreviewed_draft"`, and `content_block_published_state_check` makes that
 * mean something: a draft cannot be published, so none of this can reach a
 * customer. Development renders it through the server-owned draft preview.
 *
 * **Why it is written at all.** `F-5` built the FAQ accordion and the `FAQPage`
 * emitter against an empty array, so neither has ever rendered a row. Structure
 * with nothing behind it cannot be tested, cannot be looked at, and cannot be
 * judged. This gives it something real to carry while the words wait for the
 * person who is qualified to say them.
 *
 * **Why it is draft and not just "unfinished".** `D25`: _"I draft from brand
 * catalogues, you approve the claims."_ An answer about skin, published under
 * the name of a licensed specialist, is a clinical statement attributed to
 * someone who did not write it. `C-14` is that rule with a column behind it.
 *
 * The questions are chosen to lean operational rather than clinical wherever a
 * useful question exists there — how the routine phases fit together, what a
 * clinic-only product means, why a price is on request. Those are facts about
 * how this shop works, and they are the ones a draft can state safely. The
 * concern sets go further and are the ones needing the closest read.
 *
 * Persian and English only. Arabic catalogue vocabulary has not been reviewed
 * (`F-8`), and content follows the same rule: under the exact-locale read these
 * blocks simply do not render on `/ar`.
 */

export const CONTENT_AUTHOR_NOTE = "unreviewed_draft";

type Bilingual = { readonly fa: string; readonly en: string };

/**
 * Persian required, English optional.
 *
 * Used for body copy, because some content genuinely has no English: a Persian
 * testimonial translated into English is words put into someone's mouth in a
 * language they did not speak. A missing English row means the exact-locale
 * read drops the item on `/en`, which is the correct outcome rather than a gap.
 */
type PersianFirst = { readonly fa: string; readonly en?: string };

export type SeedContentItem = Readonly<{
  key: string;
  title: Bilingual;
  body?: PersianFirst;
  mediaObjectKey?: string;
  mediaAlt?: Bilingual;
}>;

export type SeedContentBlock = Readonly<{
  key: string;
  kind: "faq" | "editorial" | "gallery" | "campaign" | "testimonial";
  surface:
    | "shop.hub"
    | "shop.listing"
    | "pdp"
    | "landing"
    | "booking"
    | "academy";
  scopeKind?: "concern" | "brand" | "category";
  scopeSlug?: string;
  sortOrder: number;
  heading?: Bilingual;
  body?: Bilingual;
  cta?: { readonly label: Bilingual; readonly href: string };
  /**
   * Items supplied by a curated content file rather than written inline.
   *
   * Testimonials are other people's words. They belong in a reviewable file
   * beside their transcription and their consent record, not typed into a
   * TypeScript literal where the edit cannot be compared to the original.
   */
  itemsFrom?: "testimonials";
  /** Days from the seed run. Only a campaign carries one — `C-13`, `L-6`. */
  effectiveFromDays?: number;
  effectiveUntilDays?: number;
  items?: readonly SeedContentItem[];
}>;

const GENERIC_QUESTIONS: readonly SeedContentItem[] = [
  {
    key: "authentic",
    title: {
      fa: "از کجا مطمئن باشم محصول اصل است؟",
      en: "How do I know a product is genuine?",
    },
    body: {
      fa: "هر برندی که اینجا می‌بینید مستقیم از نماینده‌ی رسمی‌اش تأمین می‌شود و همان بسته‌بندی‌ای به دستتان می‌رسد که در تصویر محصول است. اگر بسته‌ای که گرفته‌اید با تصویر فرق داشت، پیش از باز کردنش با ما تماس بگیرید.",
      en: "Every brand here is sourced through its official representative, and what arrives is the packaging you see in the product photograph. If a package looks different from the picture, call us before opening it.",
    },
  },
  {
    key: "where-to-start",
    title: {
      fa: "نمی‌دانم پوستم به چه چیزی نیاز دارد. از کجا شروع کنم؟",
      en: "I don't know what my skin needs. Where do I start?",
    },
    body: {
      fa: "از دغدغه شروع کنید، نه از محصول. در نوار کناری همین صفحه می‌توانید دغدغه‌ی اصلی‌تان — لک، جوش، خشکی یا حساسیت — و نوع پوستتان را انتخاب کنید تا فهرست کوتاه‌تر و مربوط‌تر شود. اگر باز هم مطمئن نبودید، یک جلسه‌ی مشاوره‌ی پوست کوتاه‌تر از آن است که فکر می‌کنید و از خرید آزمون‌وخطا ارزان‌تر تمام می‌شود.",
      en: "Start with the concern, not the product. The sidebar on this page lets you pick what you actually want to change — pigmentation, breakouts, dryness, sensitivity — and your skin type, and the list gets shorter and more relevant. If you are still unsure, a consultation takes less time than you would expect and costs less than buying by trial and error.",
    },
  },
  {
    key: "routine-order",
    title: {
      fa: "ترتیب استفاده از محصولات چطور است؟",
      en: "What order do the products go in?",
    },
    body: {
      fa: "ترتیبی که ما در فیلترها هم به کار برده‌ایم چهار مرحله دارد: پاک‌سازی، درمان، آبرسانی و تغذیه، و محافظت. هر محصول در همین صفحه به یکی از این مرحله‌ها نسبت داده شده، بنابراین می‌توانید فیلتر «مرحله» را بزنید و ببینید کدام محصول جای خالی روتین شما را پر می‌کند.",
      en: "The order we use in the filters has four steps: cleanse, treat, hydrate, protect. Every product on this page is assigned to one of them, so you can filter by step and see what fills the gap in the routine you already have.",
    },
  },
  {
    key: "professional-only",
    title: {
      fa: "«مخصوص کلینیک» یعنی چه؟",
      en: "What does “clinic only” mean?",
    },
    body: {
      fa: "بعضی محصول‌ها برای استفاده در جلسه‌ی درمان و زیر نظر متخصص ساخته شده‌اند — معمولاً غلظت بالاتری دارند یا در بسته‌بندی حجیم حرفه‌ای عرضه می‌شوند. این‌ها را در فهرست می‌بینید تا بدانید چه چیزی در جلسه روی پوستتان استفاده می‌شود، اما به سبد خرید اضافه نمی‌شوند.",
      en: "Some products are made to be used during a treatment, by a practitioner — usually a higher concentration, or a professional bulk size. You can see them in the list so you know what is used on your skin in a session, but they cannot be added to a basket.",
    },
  },
  {
    key: "price-on-request",
    title: {
      fa: "چرا قیمت بعضی محصول‌ها نوشته نشده؟",
      en: "Why do some products have no price?",
    },
    body: {
      fa: "قیمت این‌ها به بسته‌بندی و موجودی روز بستگی دارد و ترجیح می‌دهیم عددی بنویسیم که واقعاً درست باشد. روی همان محصول «استعلام قیمت» را بزنید تا قیمت روز را برایتان بفرستیم.",
      en: "Their price depends on the pack and on what is in stock that week, and we would rather show a number that is actually right. Tap “ask for the price” on the product and we will send you the current one.",
    },
  },
  {
    key: "sensitive-skin",
    title: {
      fa: "پوستم حساس است. باید نگران چیزی باشم؟",
      en: "My skin is sensitive. Is there anything I should watch for?",
    },
    body: {
      fa: "با یک محصول جدید در هر نوبت شروع کنید، نه با یک روتین کامل — اگر واکنشی رخ داد، آن‌وقت می‌دانید از کدام است. مقدار کمی را پشت گوش یا داخل ساعد امتحان کنید و یکی دو روز صبر کنید. فیلتر «نوع پوست» را روی «حساس» بگذارید تا فهرست به محصول‌هایی محدود شود که برای این پوست در نظر گرفته شده‌اند.",
      en: "Introduce one new product at a time rather than a whole routine — if something reacts, you will know which one it was. Try a small amount behind the ear or on the inner forearm and give it a day or two. Setting the skin-type filter to “sensitive” narrows the list to what is meant for it.",
    },
  },
];

function concernFaq(
  slug: string,
  sortOrder: number,
  heading: Bilingual,
  items: readonly SeedContentItem[],
): SeedContentBlock {
  return {
    key: `shop.listing.concern.${slug}.faq`,
    kind: "faq",
    surface: "shop.listing",
    scopeKind: "concern",
    scopeSlug: slug,
    sortOrder,
    heading,
    items,
  };
}

export const CONTENT_BLOCKS: readonly SeedContentBlock[] = [
  /*
    The generic set. Every listing that has no set of its own falls back to
    this one — C-12 — so it answers the questions that are true of the whole
    shop rather than of any concern.
  */
  {
    key: "shop.listing.faq",
    kind: "faq",
    surface: "shop.listing",
    sortOrder: 100,
    heading: {
      fa: "سؤال‌هایی که زیاد پرسیده می‌شود",
      en: "Questions we are asked often",
    },
    items: GENERIC_QUESTIONS,
  },

  /*
    The editorial band below the breadcrumb. Not a promotional strip: `L-6`
    refused permanent promotional furniture, and this is the other thing — a
    paragraph that says what the page is, which is also the highest-value SEO
    text a listing can carry.
  */
  {
    key: "shop.listing.intro",
    kind: "editorial",
    surface: "shop.listing",
    sortOrder: 10,
    heading: {
      fa: "خرید بر اساس دغدغه، نه بر اساس برند",
      en: "Shop by concern, not by brand",
    },
    body: {
      fa: "فهرست زیر همان چیزی است که در مطب هم استفاده می‌کنیم. به‌جای مرور برند به برند، از دغدغه‌ی اصلی‌تان شروع کنید و بگذارید فیلترها کار را کوتاه کنند: نوع پوست، مرحله‌ی روتین، و شکل محصول.",
      en: "What follows is what we use in the practice. Rather than working brand by brand, start from what you want to change and let the filters do the narrowing: skin type, routine step, and the form the product comes in.",
    },
  },

  /*
    A campaign, with a real end date. `C-13` is the point: the window is what
    makes `L-6` enforceable instead of a promise someone has to remember.
  */
  {
    key: "shop.listing.campaign.consultation",
    kind: "campaign",
    surface: "shop.listing",
    sortOrder: 5,
    effectiveFromDays: -1,
    effectiveUntilDays: 30,
    heading: {
      fa: "مطمئن نیستید کدام را بردارید؟",
      en: "Not sure which one to take?",
    },
    body: {
      fa: "یک جلسه‌ی کوتاه مشاوره‌ی پوست رزرو کنید و با یک روتین مشخص بیرون بیایید.",
      en: "Book a short skin consultation and leave with a routine you can actually follow.",
    },
    cta: {
      label: { fa: "رزرو مشاوره", en: "Book a consultation" },
      href: "/booking",
    },
  },

  /*
    The gallery. `F-5` deferred it for a good reason — decoration does not help
    someone choose — so it earns its place by being about the products on the
    page rather than about mood.
  */
  {
    key: "shop.listing.gallery.storyderm",
    kind: "gallery",
    surface: "shop.listing",
    scopeKind: "brand",
    scopeSlug: "storyderm",
    sortOrder: 200,
    heading: { fa: "از نزدیک", en: "Up close" },
    items: [
      {
        key: "clinic-a-cream",
        title: { fa: "Clinic-A", en: "Clinic-A" },
        body: {
          fa: "برای پوست چرب و مستعد جوش",
          en: "For oily, breakout-prone skin",
        },
        mediaObjectKey:
          "catalog/storyderm/clinic-a/clinic-a-cream/primary-640.webp",
        mediaAlt: { fa: "کرم Clinic-A", en: "Clinic-A Cream" },
      },
      {
        key: "o2-white-essence",
        title: { fa: "O2 White", en: "O2 White" },
        body: {
          fa: "برای روشنی و یکدستی رنگ",
          en: "For brightness and an even tone",
        },
        mediaObjectKey:
          "catalog/storyderm/o2-white/o2-white-essence/primary-640.webp",
        mediaAlt: { fa: "اسنس O2 White", en: "O2 White Essence" },
      },
      {
        key: "timemachine-calming-aqua",
        title: { fa: "TimeMachine Calming", en: "TimeMachine Calming" },
        body: { fa: "برای پوست حساس و خشک", en: "For sensitive, dry skin" },
        mediaObjectKey:
          "catalog/storyderm/timemachine-calming/timemachine-calming-aqua/primary-640.webp",
        mediaAlt: {
          fa: "تونر TimeMachine Calming",
          en: "TimeMachine Calming Aqua",
        },
      },
      {
        key: "princess-shine-ampoule",
        title: { fa: "Princess Shine", en: "Princess Shine" },
        body: {
          fa: "برای درخشندگی پیش از مناسبت",
          en: "For glow before an occasion",
        },
        mediaObjectKey:
          "catalog/storyderm/princess-shine/princess-shine-ampoule/primary-640.webp",
        mediaAlt: { fa: "آمپول Princess Shine", en: "Princess Shine Ampoule" },
      },
    ],
  },

  /*
    ── The Landing ────────────────────────────────────────────────────────────

    Three beats, and deliberately not five. Beat 1 (the portrait) and beat 3
    (the three doors) are the page's skeleton and its primary navigation; making
    them depend on a draft content row would let a missing row take the site's
    front door with it. They stay in the message files, where the rail and the
    footer already keep their labels.

    What is here is what `L-10` says may be **absent**: the claim, the proof and
    the closing invitation. Absent means the beat, its heading, its ornament and
    its vertical rhythm all go, and the beats around it close the gap.
  */
  {
    key: "landing.claim",
    kind: "editorial",
    surface: "landing",
    sortOrder: 20,
    heading: { fa: "چرا اینجا", en: "Why here" },
    body: {
      fa: "کار روی پوست عجله برنمی‌دارد. هر جلسه از یک گفت‌وگو شروع می‌شود، محصول بعد از تشخیص انتخاب می‌شود، و هیچ مرحله‌ای برای زودتر تمام شدن حذف نمی‌شود. آنچه در فروشگاه می‌بینید دقیقاً همان چیزی است که اینجا روی پوست استفاده می‌شود.",
      en: "Skin work does not take shortcuts. Every session starts with a conversation, the product is chosen after the assessment, and no step is dropped to finish sooner. What you see in the shop is exactly what is used on skin here.",
    },
    /*
      Two credentials, and only two. `L-2` wants years of practice and students
      trained beside them; neither number exists in any document in this
      repository, and both are claims about her business. They are not invented
      here — the beat simply renders what is verifiable until they are supplied.
    */
    items: [
      {
        key: "forlled",
        title: {
          fa: "نمایندهٔ رسمی Forlle'd ژاپن",
          en: "Official representative of Forlle'd, Japan",
        },
      },
      {
        key: "instructor",
        title: {
          fa: "مدرس دارای گواهی سازمان فنی و حرفه‌ای",
          en: "Certified instructor, Technical and Vocational Training Organization",
        },
      },
    ],
  },

  /*
    The proof rail — real words, and `E-3` is why they are here at all.

    Consent on all 43 transcriptions read `unknown`, which is what packet 6
    treated as "no". The maintainer confirmed on 2026-08-26 that consent was
    obtained and the OCR simply could not see it, and that is their call to
    make: it is a fact about their business, like a price or a credential.

    Thirty-three publish. Ten are held, and not for a consent reason — nine
    carry a medical-appearance, injectable or third-party claim, which is an
    advertising-rules question that consent from the speaker does not answer,
    and one is a warm aside about the presenter rather than about the work.
    Every one of them says which, in its own row, in
    `content/testimonials/curated-2026-08-26.json`.
  */
  {
    key: "landing.proof.testimonials",
    kind: "testimonial",
    surface: "landing",
    sortOrder: 40,
    heading: {
      fa: "از زبان کسانی که آمده‌اند",
      en: "From the people who came",
    },
    itemsFrom: "testimonials",
  },

  /*
    Beat 1b — the method. Three moments of the work itself, added by `E-2`.

    The images are art direction rather than content, so the component owns
    them and the spine owns the words: `s02-ryoanji-raked-garden` for
    preparation, `s03-nara-tea-ritual` for care, `p04-cream-on-silk` for the
    material. All three are cleared for commercial use — `public/images/README.md`
    says so and also says they were unused only because no slot had been
    designed for them. `E-4` designs the slots.
  */
  {
    key: "landing.method",
    kind: "gallery",
    surface: "landing",
    sortOrder: 15,
    heading: { fa: "کار چطور پیش می‌رود", en: "How the work goes" },
    items: [
      {
        key: "prepare",
        title: { fa: "اول، نگاه کردن", en: "First, looking" },
        body: {
          fa: "هر جلسه با دیدن پوست شروع می‌شود، نه با باز کردن محصول. اینکه امروز چه چیزی لازم نیست، به اندازهٔ چیزی که لازم است اهمیت دارد.",
          en: "Every session starts by looking at the skin, not by opening a product. What is not needed today matters as much as what is.",
        },
      },
      {
        key: "treat",
        title: { fa: "بعد، کار کردن", en: "Then, working" },
        body: {
          fa: "مرحله‌ها به ترتیب انجام می‌شوند و هیچ‌کدام برای زودتر تمام شدن کوتاه نمی‌آید. اگر قرار است پوست بعد از جلسه واکنشی نشان بدهد، از قبل گفته می‌شود.",
          en: "The steps run in order and none is cut short to finish sooner. If the skin is going to react afterwards, you are told before it does.",
        },
      },
      {
        key: "aftercare",
        title: { fa: "و بعدش، خانه", en: "And afterwards, home" },
        body: {
          fa: "بیشترِ نتیجه بیرون از مطب ساخته می‌شود. روتین خانگی کوتاه بسته می‌شود تا واقعاً انجام شود.",
          en: "Most of the result is made outside the practice. The home routine is kept short so that it actually happens.",
        },
      },
    ],
  },

  /*
    Beat 2b — the Forlle'd passage. The one place the brand's Japanese
    reference is allowed to be the subject rather than the decoration, and it
    sits on the one relationship `content/brands/` records as **confirmed**.

    改善 — kaizen — is used here in its plain sense: improvement by small steps
    that do not stop. `L-9` bounds the Japanese register to exactly this: a
    concept may appear where a verifiable fact carries it, and the fact here is
    the representation itself.
  */
  {
    key: "landing.forlled",
    kind: "editorial",
    surface: "landing",
    sortOrder: 30,
    heading: { fa: "از ژاپن، با صبر", en: "From Japan, patiently" },
    body: {
      fa: "فورله‌د در ژاپن ساخته می‌شود، جایی که «改善» — بهتر شدن با قدم‌های کوچکی که متوقف نمی‌شوند — یک شعار نیست، روش کار است. همان چیزی که روی پوست هم جواب می‌دهد: نتیجه از یک جلسهٔ معجزه‌آسا نمی‌آید، از تکرار درست می‌آید. نمایندگی رسمی این برند در مشهد اینجاست.",
      en: "Forlle'd is made in Japan, where 改善 — getting better by small steps that do not stop — is a way of working rather than a slogan. It is also what actually works on skin: the result does not come from one miraculous session, it comes from correct repetition. This is the brand's official representation in Mashhad.",
    },
    cta: {
      label: { fa: "دیدن محصولات فورله‌د", en: "See the Forlle'd products" },
      // `/shop`, not `/shop/brand/forlled`: Forlle'd has no catalogue rows
      // yet, and a beat that ends in a 404 is worse than one that ends in the
      // shop.
      href: "/shop",
    },
  },

  /*
    Beat 3b — what she teaches, added by `E-2`.

    Ten real offerings, transcribed from her own Instagram highlights in
    `content/academy/`. Titles only: `L-4` holds prices, dates and capacity as
    unconfirmed, and a course listing that invents a price is worse than one
    that does not mention money. The rail says what exists and the Academy room
    says the rest, when it has the rest to say.
  */
  {
    key: "landing.academy",
    kind: "gallery",
    surface: "landing",
    sortOrder: 50,
    heading: { fa: "چه چیزی آموزش می‌دهد", en: "What she teaches" },
    cta: {
      label: { fa: "دیدن همهٔ دوره‌ها", en: "See every course" },
      href: "/academy",
    },
    items: [
      {
        key: "foundational-skincare",
        title: { fa: "دورهٔ مقدماتی", en: "Foundational course" },
        body: { fa: "نه روز، از پایه" },
      },
      {
        key: "advanced-skincare",
        title: { fa: "دورهٔ پیشرفته", en: "Advanced course" },
        body: { fa: "پانزده روز، برای ادامه دادن" },
      },
      {
        key: "time-machine-workshop",
        title: { fa: "کارگاه تایم‌ماشین", en: "TimeMachine workshop" },
        body: { fa: "پروتکل کامل، روی مدل" },
      },
      {
        key: "o2-princess-shine-workshop",
        title: {
          fa: "کارگاه ترکیبی O₂ و پرنسس شاین",
          en: "O₂ and Princess Shine workshop",
        },
        body: { fa: "دو پروتکل، کنار هم" },
      },
      {
        key: "stem-cells-workshop",
        title: { fa: "کارگاه سلول‌های بنیادی", en: "Stem cell workshop" },
      },
      {
        key: "forlled-japan-workshop",
        title: { fa: "کارگاه فورله‌د ژاپن", en: "Forlle'd Japan workshop" },
        body: { fa: "با نمایندگی رسمی" },
      },
      {
        key: "mccosmetics-workshop",
        title: { fa: "کارگاه MCCosmetics", en: "MCCosmetics workshop" },
      },
      {
        key: "dermaplaning-workshop",
        title: { fa: "کارگاه درماپلنینگ", en: "Dermaplaning workshop" },
      },
      {
        key: "absorbable-filler-workshop",
        title: { fa: "کارگاه فیلر جذبی", en: "Absorbable filler workshop" },
      },
      {
        key: "biorepeel-workshop",
        title: { fa: "کارگاه بایورپیل", en: "BioRePeel workshop" },
      },
    ],
  },

  {
    key: "landing.invitation",
    kind: "editorial",
    surface: "landing",
    sortOrder: 60,
    heading: { fa: "از یک گفت‌وگو شروع کنید", en: "Start with a conversation" },
    body: {
      fa: "قبل از اینکه چیزی بخرید، بیایید ببینیم پوستتان واقعاً به چه چیزی نیاز دارد. یک جلسهٔ کوتاه، و روتینی که بشود واقعاً ادامه‌اش داد — نه فهرستی که هفتهٔ دوم رهایش کنید.",
      en: "Before you buy anything, let us see what your skin actually needs. One short session, and a routine you can keep — not a list you abandon in week two.",
    },
    cta: {
      label: { fa: "رزرو وقت مشاوره", en: "Book a consultation" },
      href: "/booking",
    },
  },

  concernFaq("lak", 100, { fa: "درباره‌ی لک", en: "About pigmentation" }, [
    {
      key: "how-long",
      title: {
        fa: "چقدر طول می‌کشد تا لک کم‌رنگ شود؟",
        en: "How long does pigmentation take to fade?",
      },
      body: {
        fa: "پوست با سرعت خودش نو می‌شود و این سرعت در همه یکسان نیست؛ معمولاً چند هفته طول می‌کشد تا تفاوت در آینه دیده شود، نه چند روز. مهم‌تر از انتخاب محصول این است که هر روز استفاده شود و ضدآفتاب کنارش قطع نشود — بدون آن، هر پیشرفتی دوباره از دست می‌رود.",
        en: "Skin renews at its own pace and that pace is not the same for everyone; a visible difference usually takes weeks rather than days. What matters more than the choice of product is using it daily and not dropping sun protection alongside it — without that, progress is given straight back.",
      },
    },
    {
      key: "sunscreen",
      title: {
        fa: "در فصل سرد هم ضدآفتاب لازم است؟",
        en: "Do I need sunscreen in winter?",
      },
      body: {
        fa: "بله. نوری که باعث تیرگی می‌شود در روز ابری هم هست و از پشت شیشه هم رد می‌شود. اگر بیشتر وقتتان داخل خانه می‌گذرد، یک بار در صبح کافی است؛ اگر بیرون هستید، تجدید کنید.",
        en: "Yes. The light that darkens pigmentation is there on an overcast day and passes through window glass. If you are mostly indoors, once in the morning is enough; if you are out, reapply.",
      },
    },
    {
      key: "combine",
      title: {
        fa: "می‌توانم چند محصول روشن‌کننده را با هم استفاده کنم؟",
        en: "Can I use several brightening products together?",
      },
      body: {
        fa: "لازم نیست و معمولاً نتیجه‌ی بهتری نمی‌دهد. یک محصول را برای چند هفته ثابت نگه دارید تا بتوانید قضاوت کنید که کار می‌کند یا نه. اگر پوستتان سوزش یا قرمزی گرفت، تعداد دفعات را کم کنید.",
        en: "You do not need to, and it usually does not work better. Keep one product steady for a few weeks so you can actually judge whether it is doing anything. If your skin stings or reddens, reduce how often you use it.",
      },
    },
  ]),

  concernFaq(
    "acne",
    100,
    { fa: "درباره‌ی جوش و آکنه", en: "About breakouts" },
    [
      {
        key: "worse-first",
        title: {
          fa: "چرا اوایل بدتر شد؟",
          en: "Why did it get worse at first?",
        },
        body: {
          fa: "این اتفاق غیرعادی نیست و معمولاً چند هفته‌ی اول رخ می‌دهد. اگر شدت‌گرفتن ملایم است، فاصله‌ی استفاده را بیشتر کنید و ادامه دهید؛ اگر دردناک یا گسترده شد، متوقف کنید و بپرسید — ادامه دادن به امید عبور از آن، تصمیم درستی نیست.",
          en: "It is not unusual and it usually happens in the first few weeks. If it is mild, space out how often you use the product and carry on; if it turns painful or spreads, stop and ask — pushing through in the hope it passes is not the right call.",
        },
      },
      {
        key: "moisturiser",
        title: {
          fa: "پوست چرب هم به آبرسان نیاز دارد؟",
          en: "Does oily skin need a moisturiser?",
        },
        body: {
          fa: "بله. پوستی که خشک می‌شود معمولاً چربی بیشتری تولید می‌کند، و پاک‌کننده‌ی تند بدون آبرسان همین چرخه را تندتر می‌کند. بافت سبک انتخاب کنید، اما حذفش نکنید.",
          en: "Yes. Skin that is stripped tends to produce more oil, and a harsh cleanser with nothing after it speeds that cycle up. Choose a light texture, but do not skip it.",
        },
      },
      {
        key: "clinic-products",
        title: {
          fa: "محصول‌های کلینیکی این خط را در خانه هم می‌شود استفاده کرد؟",
          en: "Can I use the clinic products at home?",
        },
        body: {
          fa: "آن‌هایی که «مخصوص کلینیک» علامت خورده‌اند نه — برای استفاده در جلسه و زیر نظر متخصص در نظر گرفته شده‌اند. بقیه‌ی محصول‌های همین خط برای خانه هستند و در فهرست قابل خریدند.",
          en: "Not the ones marked clinic-only — those are meant for use in a session, by a practitioner. The rest of the same range is for home and is purchasable in the list.",
        },
      },
    ],
  ),

  concernFaq(
    "hydration",
    100,
    { fa: "درباره‌ی آبرسانی", en: "About hydration" },
    [
      {
        key: "dry-vs-dehydrated",
        title: {
          fa: "پوست خشک با پوست کم‌آب فرق دارد؟",
          en: "Is dry skin the same as dehydrated skin?",
        },
        body: {
          fa: "بله و این تفاوت انتخاب محصول را عوض می‌کند. پوست خشک چربی کم دارد و به بافت غنی‌تر نیاز دارد؛ پوست کم‌آب آب کم دارد و ممکن است هم‌زمان چرب هم باشد. اگر پوستتان براق است اما کش‌آمده و ناراحت، احتمالاً با دومی طرفید.",
          en: "They are different, and the difference changes what to buy. Dry skin is short on oil and wants a richer texture; dehydrated skin is short on water and can be oily at the same time. If your skin looks shiny but feels tight, it is probably the second.",
        },
      },
      {
        key: "layering",
        title: {
          fa: "لایه‌لایه استفاده کردن فایده دارد؟",
          en: "Is layering worth it?",
        },
        body: {
          fa: "تا حدی. یک لایه‌ی آبرسان روی پوست هنوز نم‌دار و بعد یک لایه که آن را نگه دارد، از سه محصول روی پوست خشک بهتر جواب می‌دهد. ترتیب مهم‌تر از تعداد است.",
          en: "Up to a point. One hydrating layer on skin that is still damp, then something to hold it in, does more than three products on dry skin. The order matters more than the count.",
        },
      },
    ],
  ),

  concernFaq(
    "barrier",
    100,
    { fa: "درباره‌ی ترمیم سد پوستی", en: "About barrier repair" },
    [
      {
        key: "signs",
        title: {
          fa: "از کجا بفهمم سد پوستی‌ام آسیب دیده؟",
          en: "How do I know my barrier is compromised?",
        },
        body: {
          fa: "معمولاً پوست به چیزهایی واکنش نشان می‌دهد که قبلاً نشان نمی‌داد: سوزش کوتاه بعد از شست‌وشو، قرمزی که دیر می‌خوابد، و حس کشیدگی حتی بعد از آبرسان. اغلب هم بعد از یک دوره‌ی لایه‌برداری زیاد پیش می‌آید.",
          en: "Usually the skin starts reacting to things it used to tolerate: a brief sting after washing, redness that takes its time to settle, tightness even after a moisturiser. It often follows a stretch of too much exfoliation.",
        },
      },
      {
        key: "what-to-stop",
        title: {
          fa: "در این دوره چه چیزی را باید کنار بگذارم؟",
          en: "What should I pause?",
        },
        body: {
          fa: "لایه‌بردارها، اسیدها و هر چیزی که پوست را داغ یا سوزنده می‌کند، تا وقتی که پوست آرام شود. روتین را به سه چیز کم کنید: پاک‌کننده‌ی ملایم، آبرسان، و ضدآفتاب.",
          en: "Exfoliants, acids, and anything that leaves the skin hot or stinging, until it settles. Cut the routine down to three things: a gentle cleanser, a moisturiser, and sun protection.",
        },
      },
    ],
  ),

  concernFaq(
    "aging",
    100,
    { fa: "درباره‌ی مراقبت از پوست در گذر زمان", en: "About age support" },
    [
      {
        key: "when-to-start",
        title: {
          fa: "از چه سنی باید شروع کرد؟",
          en: "What age should I start?",
        },
        body: {
          fa: "پرسش مفیدترش این است که «چه چیزی را زودتر شروع کنم» — و جوابش تقریباً همیشه ضدآفتاب و ثبات روتین است، در هر سنی. باقی محصول‌ها را وقتی اضافه کنید که دلیل مشخصی برایشان داشته باشید.",
          en: "The more useful question is what to start early — and the answer is nearly always sun protection and a routine you actually keep, at any age. Add the rest when you have a specific reason for it.",
        },
      },
      {
        key: "eye-area",
        title: {
          fa: "دور چشم محصول جدا لازم دارد؟",
          en: "Does the eye area need its own product?",
        },
        body: {
          fa: "همیشه نه. پوست آن ناحیه نازک‌تر است، پس بافت سبک‌تر و مقدار کمتر منطقی است، اما اگر آبرسان صورتتان آزارتان نمی‌دهد، محصول جداگانه ضروری نیست. جایی که ارزش دارد، وقتی است که فرمول صورت برای آن ناحیه سنگین یا تحریک‌کننده باشد.",
          en: "Not always. The skin there is thinner, so a lighter texture and less of it makes sense, but if your face moisturiser does not bother it, a separate product is not essential. It earns its place when the face formula is too heavy or too active for that area.",
        },
      },
    ],
  ),

  {
    key: "shop.listing.brand.storyderm.faq",
    kind: "faq",
    surface: "shop.listing",
    scopeKind: "brand",
    scopeSlug: "storyderm",
    sortOrder: 100,
    heading: { fa: "درباره‌ی Storyderm", en: "About Storyderm" },
    items: [
      {
        key: "what-is-it",
        title: { fa: "Storyderm چه برندی است؟", en: "What is Storyderm?" },
        body: {
          fa: "یک برند کره‌ای مراقبت از پوست که هم خط خانگی دارد و هم محصول‌های حرفه‌ای برای استفاده در جلسه. در این فهرست هر دو را می‌بینید و آن‌هایی که فقط در کلینیک استفاده می‌شوند جداگانه علامت خورده‌اند.",
          en: "A Korean skincare brand with both a home range and professional products used during treatments. You will see both in this list, and the clinic-only ones are marked as such.",
        },
      },
      {
        key: "ranges",
        title: {
          fa: "این همه خط محصول؛ کدام برای من است؟",
          en: "There are a lot of ranges — which one is mine?",
        },
        body: {
          fa: "خط‌ها بر اساس دغدغه چیده شده‌اند نه بر اساس نوع محصول: Clinic-A برای پوست مستعد جوش، O2 White و Princess Shine برای روشنی، TimeMachine و Anti-Red برای پوست حساس، و Ultra Lift و Anti-Wrinkle برای سفتی و خطوط. فیلتر «خط محصول» در نوار کناری همین‌ها را نشان می‌دهد.",
          en: "The ranges are organised by concern rather than by product type: Clinic-A for breakout-prone skin, O2 White and Princess Shine for brightness, TimeMachine and Anti-Red for sensitivity, Ultra Lift and Anti-Wrinkle for firmness and lines. The range filter in the sidebar lists them.",
        },
      },
      {
        key: "sizes",
        title: {
          fa: "چرا بعضی محصول‌ها در دو اندازه هستند؟",
          en: "Why do some products come in two sizes?",
        },
        body: {
          fa: "اندازه‌ی بزرگ‌تر معمولاً همان فرمول در بسته‌بندی حرفه‌ای است — برای استفاده در مطب یا برای کسی که محصول را قبلاً امتحان کرده. هر دو اندازه زیر یک محصول هستند تا لازم نباشد دو صفحه را با هم مقایسه کنید.",
          en: "The larger size is usually the same formula in a professional pack — for use in the practice, or for someone who has already tried it. Both sizes sit under one product so you are not comparing two pages.",
        },
      },
    ],
  },
];
