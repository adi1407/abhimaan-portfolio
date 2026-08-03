import type { NavItem } from "@/types";
import { ROUTES } from "@/lib/constants";

/** Behance desk scraps — the same posters as the home playground. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Index", href: ROUTES.index, index: "01", poster: "/one.png" },
  { label: "About", href: ROUTES.about, index: "02", poster: "/two.png" },
  { label: "Work", href: ROUTES.work, index: "03", poster: "/three.png" },
  { label: "Experience", href: ROUTES.works, index: "04", poster: "/four.png" },
  { label: "Services", href: ROUTES.services, index: "05", poster: "/five.png" },
  { label: "Contact", href: ROUTES.contact, index: "06", poster: "/one.png" },
] as const;

/** Prefetch targets for the route wipe — warm the browser cache on boot. */
export const NAV_POSTERS = NAV_ITEMS.map((item) => item.poster);

export function getNavItemByHref(href: string) {
  const path = href.split("?")[0]?.split("#")[0] || href;

  return (
    NAV_ITEMS.find((item) =>
      path === "/"
        ? item.href === "/"
        : path === item.href || path.startsWith(`${item.href}/`),
    ) ?? NAV_ITEMS[0]
  );
}
