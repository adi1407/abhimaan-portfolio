"use client";

import type { MouseEvent } from "react";
import { FlowingMenu } from "@/components/motion/flowing-menu";
import {
  FLOWING_MENU_NAV,
  NAV_FLOW_IMAGES,
} from "@/components/motion/flowing-menu-presets";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { useNav } from "@/components/layout/nav-provider";
import { usePathname, useSearchParams } from "next/navigation";
import { getNavItemByHref } from "@/lib/nav";

export function NavMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    menuOpen,
    setMenuOpen,
    navigateWithTransition,
    transition,
  } = useNav();
  const locationKey =
    searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  const activeHref = getNavItemByHref(locationKey).href;
  const busy = transition.active;

  const flowingItems = NAV_ITEMS.map((item) => ({
    text: item.label,
    image: NAV_FLOW_IMAGES[item.href] ?? NAV_FLOW_IMAGES["/"],
    disabled: busy,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (busy) return;
      const rect = e.currentTarget.getBoundingClientRect();
      navigateWithTransition(item, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    },
  }));

  return (
    <div
      className={cn("nav-menu", menuOpen && "is-open", busy && "is-busy")}
      aria-hidden={!menuOpen}
      aria-busy={busy || undefined}
      inert={!menuOpen || busy ? true : undefined}
    >
      <header className="nav-menu__top">
        <p className="nav-menu__eyebrow">Navigation</p>
        <button
          type="button"
          className="nav-menu__close"
          aria-label="Close menu"
          disabled={busy}
          onClick={() => setMenuOpen(false)}
        >
          Close
          <span className="nav-menu__close-x" aria-hidden>
            ×
          </span>
        </button>
      </header>

      <div className="nav-menu__flow">
        <FlowingMenu
          className="nav-menu__flowing"
          items={flowingItems}
          {...FLOWING_MENU_NAV}
        />
      </div>

      <footer className="nav-menu__foot">
        <p className="nav-menu__foot-note">
          {NAV_ITEMS.find((item) => item.href === activeHref)?.cue ??
            "Selected work · Briefs · Studio"}
        </p>
      </footer>
    </div>
  );
}
