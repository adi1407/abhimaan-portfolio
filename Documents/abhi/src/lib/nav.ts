import type { NavItem } from "@/types";
import { ROUTES } from "@/lib/constants";
import { FUN_DESIGNS } from "@/lib/fun-designs";

const scrap = (id: string) => {
  const d = FUN_DESIGNS.find((x) => x.id === id) ?? FUN_DESIGNS[0];
  return { poster: d.src, posterTitle: d.title, posterNote: d.note };
};

/** Behance desk scraps power the route wipe (same assets as Desk scraps). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Index", href: ROUTES.index, index: "01", ...scrap("01") },
  { label: "About", href: ROUTES.about, index: "02", ...scrap("02") },
  { label: "Work", href: ROUTES.work, index: "03", ...scrap("03") },
  { label: "Experience", href: ROUTES.works, index: "04", ...scrap("04") },
  { label: "Contact", href: ROUTES.contact, index: "05", ...scrap("05") },
] as const;

/** Prefetch targets for the route wipe — warm the browser cache on boot. */
export const NAV_POSTERS = [...new Set(NAV_ITEMS.map((item) => item.poster))];

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
