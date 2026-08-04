import type { NavItem } from "@/types";
import { ROUTES } from "@/lib/constants";

/** Primary routes — each carries a wipe accent + nav theme (no poster images). */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Index",
    href: ROUTES.index,
    index: "01",
    cue: "Infinite artboard — layers in motion",
    accent: "#2f6bff",
    theme: "home",
  },
  {
    label: "About",
    href: ROUTES.about,
    index: "02",
    cue: "Portrait, process & point of view",
    accent: "#0b1f4d",
    theme: "about",
  },
  {
    label: "Work",
    href: ROUTES.work,
    index: "03",
    cue: "Selected frames — film to gallery",
    accent: "#1a6b5c",
    theme: "work",
  },
  {
    label: "Experience",
    href: ROUTES.works,
    index: "04",
    cue: "Roles, systems & studio practice",
    accent: "#7c4a1a",
    theme: "works",
  },
  {
    label: "Contact",
    href: ROUTES.contact,
    index: "05",
    cue: "Briefs, bids & beginnings",
    accent: "#2563ff",
    theme: "contact",
  },
] as const;

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
