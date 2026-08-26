import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCart } from "@/modules/cart/cart.reads";
import { CartScreen } from "@/modules/cart/screens/cart.screen";

/**
 * The cart's own address — `CART-05`.
 *
 * `noindex`. A cart is per-person state behind a session or an httpOnly cookie:
 * there is nothing here for a crawler, every fetch of it would be a different
 * document, and indexing one would put someone's basket in a search result.
 * It stays `follow` so the links out of it still pass through.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function CartPage({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Read on the server and hand the result down as the query's initial data.
  //
  // Without this the page rendered «در حال بارگذاری سبد…» and stopped there for
  // anyone without JavaScript — the cart was visible only to browsers that
  // could run a fetch. `AGENTS.md` requires the storefront to work with
  // JavaScript off, and a basket you cannot see is not a soft failure.
  //
  // This page is not a Query consumer. It reads here, renders on the server,
  // and its controls are forms whose Server Actions revalidate the route — a
  // loop that needs no client cache. Query's approved consumer is the drawer,
  // which has no server render to inherit.
  const cart = await getCart(locale);

  return <CartScreen cart={cart} />;
}
