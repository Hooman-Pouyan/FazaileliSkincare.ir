import { describe, expect, it } from "vitest";
import { resolveEnquiryHref } from "./enquiry";

/**
 * The case this exists for is the first one: `shop.enquiryHref` has been
 * `https://wa.me/` since packet 5, which opens WhatsApp with nobody in it.
 */
describe("resolveEnquiryHref", () => {
  it("refuses a messaging URL with no recipient", () => {
    // Given: the value the messages actually carry today
    // When: the destination is resolved
    // Then: there is nowhere to send anyone, so there is no control
    expect(resolveEnquiryHref("https://wa.me/")).toBeNull();
    expect(resolveEnquiryHref("https://wa.me")).toBeNull();
    expect(resolveEnquiryHref("https://t.me/")).toBeNull();
    expect(resolveEnquiryHref("https://api.whatsapp.com/")).toBeNull();
  });

  it("accepts a messaging URL that names someone", () => {
    // Given: the same host with a number after it
    // When: resolved
    // Then: it is a real conversation and the control may render
    expect(resolveEnquiryHref("https://wa.me/989120000000")).toBe(
      "https://wa.me/989120000000",
    );
    expect(
      resolveEnquiryHref("https://api.whatsapp.com/send?phone=989120000000"),
    ).toBe("https://api.whatsapp.com/send?phone=989120000000");
  });

  it("treats blank, whitespace and undefined as no destination", () => {
    expect(resolveEnquiryHref(undefined)).toBeNull();
    expect(resolveEnquiryHref(null)).toBeNull();
    expect(resolveEnquiryHref("")).toBeNull();
    expect(resolveEnquiryHref("   ")).toBeNull();
  });

  it("accepts an internal route but not the bare root", () => {
    // A contact page is a perfectly good destination; "/" is not one.
    expect(resolveEnquiryHref("/contact")).toBe("/contact");
    expect(resolveEnquiryHref("/")).toBeNull();
  });

  it("accepts tel and mailto when they carry an address", () => {
    expect(resolveEnquiryHref("tel:+985100000000")).toBe("tel:+985100000000");
    expect(resolveEnquiryHref("mailto:hi@fazaieli.ir")).toBe(
      "mailto:hi@fazaieli.ir",
    );
    expect(resolveEnquiryHref("tel:")).toBeNull();
  });

  it("refuses something that is not a URL rather than letting it resolve", () => {
    // `href="wa.me/98912"` resolves against the current page and quietly
    // navigates to /shop/p/wa.me/98912.
    expect(resolveEnquiryHref("wa.me/989120000000")).toBeNull();
  });

  it("leaves an ordinary external destination alone", () => {
    expect(resolveEnquiryHref("https://instagram.com/fazaieli")).toBe(
      "https://instagram.com/fazaieli",
    );
  });
});
