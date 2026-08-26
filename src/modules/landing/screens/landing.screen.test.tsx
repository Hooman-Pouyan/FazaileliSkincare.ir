import type { ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fa from "@/messages/fa.json";
import type { LandingPage } from "../models/page-models";
import { LandingScreen } from "./landing.screen";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    locale,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { readonly locale?: string }) => {
    void locale;
    return <a {...props} />;
  },
}));

vi.mock("next/image", () => ({
  default: ({
    fill,
    priority,
    ...props
  }: ComponentPropsWithoutRef<"img"> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    void fill;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} {...props} />;
  },
}));

function render(page: LandingPage): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="fa" messages={fa}>
      <LandingScreen page={page} />
    </NextIntlClientProvider>,
  );
}

/** The state it ships in: every content-backed beat empty. */
const EMPTY: LandingPage = {
  claim: null,
  testimonials: [],
  comparisons: [],
  invitation: null,
};

const FULL: LandingPage = {
  claim: {
    heading: "چرا اینجا",
    body: "هر مرحله شمرده است.",
    credentials: [
      { key: "forlled", label: "نمایندهٔ رسمی Forlle'd ژاپن" },
      { key: "instructor", label: "مدرس دارای گواهی سازمان فنی و حرفه‌ای" },
    ],
  },
  testimonials: [
    { key: "s1", attribution: "سمیرا ن. — نمونه", quote: "توضیح دادند چرا." },
  ],
  comparisons: [
    {
      key: "c1",
      caption: "دورهٔ هشت‌هفته‌ای",
      before: { url: "/media/x/before-640.webp", alt: "پیش" },
      after: { url: "/media/x/after-640.webp", alt: "پس" },
    },
  ],
  invitation: {
    heading: "از یک گفت‌وگو شروع کنید",
    body: "یک جلسهٔ کوتاه.",
    cta: { label: "رزرو وقت مشاوره", href: "/booking" },
  },
};

/**
 * `LAND-10`: absence is a designed state, not an edge case — so it is the state
 * asserted first. A beat whose content is unapproved must disappear entirely,
 * heading and ornament included, rather than render an empty frame or a
 * "coming soon".
 */
describe("absence is the state it ships in", () => {
  const html = render(EMPTY);

  it("renders the portrait and the doors regardless", () => {
    // Beats 1 and 3 are the page's skeleton and its primary navigation. A
    // missing content row must never be able to take the front door with it.
    expect(html).toContain(fa.landing.headline);
    expect(html).toContain(fa.nav.shop);
    expect(html).toContain(fa.nav.book);
    expect(html).toContain(fa.nav.academy);
  });

  it("renders no heading for a beat that has no content", () => {
    expect(html).not.toContain(fa.landing.testimonials.label);
    expect(html).not.toContain(fa.landing.comparison.heading);
  });

  it("leaves no empty frame behind, and no ornament either", () => {
    // The Divider only lives inside the proof beat; if the beat is gone so is
    // its ornament and its vertical rhythm.
    expect(html).not.toContain("brand-glyph-128.png");
  });

  it("says nothing about content that is coming", () => {
    for (const weasel of ["به‌زودی", "coming soon", "در دست"]) {
      expect(html).not.toContain(weasel);
    }
  });
});

describe("the beats, when they have something behind them", () => {
  const html = render(FULL);

  it("renders the claim as editorial type, with its credentials", () => {
    expect(html).toContain("نمایندهٔ رسمی Forlle&#x27;d ژاپن");
    expect(html).toContain("مدرس دارای گواهی سازمان فنی و حرفه‌ای");
  });

  it("puts every quote in the static HTML, before any carousel initialises", () => {
    // Swiper hydrates a rail that is already real elements in the document —
    // `M-3`. A quote that only exists after hydration is a quote a crawler
    // never sees.
    expect(html).toContain("توضیح دادند چرا.");
    expect(html).toContain("سمیرا ن. — نمونه");
  });

  it("keeps the closing beat to one action", () => {
    const invitation = html.slice(html.lastIndexOf("از یک گفت‌وگو شروع کنید"));
    const links = invitation.split("<a ").length - 1;
    expect(links).toBe(1);
  });

  it("holds the beats in the order L-2 fixed", () => {
    // Each needle is a phrase that appears exactly once. `nav.academy` looked
    // like the obvious marker for beat 3 and is not: «آکادمی» is also inside
    // the beat-1 lede, so `indexOf` found the wrong occurrence and the test
    // failed for a reason that had nothing to do with the order.
    const order = [
      fa.landing.headline,
      "چرا اینجا",
      fa.landing.doors.academy,
      "سمیرا ن. — نمونه",
      "از یک گفت‌وگو شروع کنید",
    ].map((needle) => html.indexOf(needle));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

/**
 * `LAND-05`: the spine is the page's through-line and not its content. Removing
 * it entirely must leave a page that still reads correctly — asserted here
 * rather than trusted, because an ornament that turns out to be load-bearing is
 * only discovered by deleting it.
 */
describe("the growth spine carries nothing a reader needs", () => {
  it("is hidden from assistive technology wherever it appears", () => {
    const html = render(FULL);
    const spines = html.split('aria-hidden="true"').length - 1;
    expect(spines).toBeGreaterThan(0);
  });

  it("leaves every word of the page behind when it is stripped out", () => {
    const html = render(FULL);
    const withoutSvg = html.replace(/<svg[\s\S]*?<\/svg>/g, "");

    for (const needle of [
      fa.landing.headline,
      "چرا اینجا",
      "نمایندهٔ رسمی Forlle&#x27;d ژاپن",
      "توضیح دادند چرا.",
      "از یک گفت‌وگو شروع کنید",
    ]) {
      expect(withoutSvg).toContain(needle);
    }
  });
});
