"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { type NavigationRoom, activeRoom } from "@/lib/navigation/manifest";

/**
 * The smallest client component that owns one thing: which rail entry is lit.
 *
 * Next gives a layout no pathname, and the alternatives are worse. Reading a
 * header set by the proxy would make the whole layout dynamic and cost the
 * landing page its static render; passing `active` down from every route
 * duplicates knowledge of the room structure into each one. So the server
 * renders the rail's structure, labels and destinations, and this leaf decides
 * the single bit of state that depends on where the customer is.
 */
export function RailLink({
  href,
  room,
  label,
  accent,
  children,
}: {
  readonly href: string;
  readonly room: NavigationRoom | null;
  readonly label: string;
  readonly accent?: string;
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const isCurrent = room !== null && room === activeRoom(pathname);

  return (
    <span className="relative grid place-items-center">
      {isCurrent && accent ? (
        <span
          aria-hidden
          className="absolute start-[-14px] top-1/2 h-6 w-0.5 -translate-y-1/2"
          style={{ background: accent }}
        />
      ) : null}
      <Link
        href={href}
        title={label}
        aria-current={isCurrent ? "page" : undefined}
        data-current={isCurrent ? "true" : undefined}
        className="grid size-11 place-items-center text-[color:var(--stone)] data-[current=true]:text-[color:var(--ink)]"
      >
        {children}
        <span className="sr-only">{label}</span>
      </Link>
    </span>
  );
}
