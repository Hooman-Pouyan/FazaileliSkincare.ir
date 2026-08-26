/**
 * Where an `on_request` enquiry goes — or nothing, when it goes nowhere.
 *
 * `shop.enquiryHref` is `https://wa.me/` with no number after it, and has been
 * since packet 5 (review item `5.3`). A WhatsApp URL with an empty path opens
 * WhatsApp with no conversation: the reader taps «قیمت را بپرسید», the app
 * launches, and there is no one to write to.
 *
 * `PDP-09` puts it plainly — *"no fake 'contact us' action that points
 * nowhere"* — so this decides once, for every surface, whether the destination
 * the messages carry is real. When it is not, the offer state still renders and
 * still explains itself; only the control disappears. Failing closed is the
 * whole point: a missing number is the maintainer's to supply, and papering
 * over it with a dead link hides the gap instead of showing it.
 *
 * It lives beside `offer.ts` rather than inside a component because the hub,
 * the listing tile and the product page all ask the same question, and three
 * components each deciding it separately is how two of them end up wrong.
 */

/** Hosts whose bare origin is a valid page but a useless destination. */
const MESSAGING_HOSTS = new Set([
  "wa.me",
  "api.whatsapp.com",
  "t.me",
  "m.me",
]);

export function resolveEnquiryHref(
  raw: string | null | undefined,
): string | null {
  const value = raw?.trim();
  if (!value) return null;

  // A relative path is an internal route and is real if it is not just "/".
  if (value.startsWith("/")) return value === "/" ? null : value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Not a URL at all. Better to show no control than an href the browser
    // will resolve against the current page and silently misroute.
    return null;
  }

  if (url.protocol === "tel:" || url.protocol === "mailto:") {
    return url.pathname.length > 0 ? value : null;
  }

  // The case that actually happens: a messaging host with no recipient.
  const identifier = `${url.pathname}${url.search}`.replace(/[/?]/g, "");
  if (MESSAGING_HOSTS.has(url.hostname) && identifier.length === 0) return null;

  return value;
}
