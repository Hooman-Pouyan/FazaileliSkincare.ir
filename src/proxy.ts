import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` and runs it on the Node
 * runtime. Locale routing lives here.
 */
const proxy = createMiddleware(routing);

export default proxy;

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
