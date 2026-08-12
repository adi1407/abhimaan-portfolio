"use client";

import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { useNav } from "@/components/layout/nav-provider";
import { usePathname, useSearchParams } from "next/navigation";
import { getNavItemByHref } from "@/lib/nav";

const PREVIEWS: Record<string, string> = {
  "/": "Index",
  "/about": "Portrait",
  "/work": "Selected",
  "/works": "Roles",
  "/contact": "→",
};

export function NavMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    menuOpen,
    setMenuOpen,
    navigateWithTransition,
    setCursorExpanded,
    transition,
  } = useNav();
  const locationKey =
    searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  const activeHref = getNavItemByHref(locationKey).href;
  const busy = transition.active;

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

      <nav aria-label="Mobile primary" className="nav-menu__list">
        {NAV_ITEMS.map((item, i) => {
          const active = item.href === activeHref;

          return (
            <button
              key={item.href}
              type="button"
              className={cn(
                "nav-menu__row",
                active && "is-active",
              )}
              style={{ ["--i" as string]: i }}
              aria-current={active ? "page" : undefined}
              disabled={busy}
              onMouseEnter={() => setCursorExpanded(true)}
              onMouseLeave={() => setCursorExpanded(false)}
              onClick={(e) => {
                if (busy) return;
                const rect = e.currentTarget.getBoundingClientRect();
                navigateWithTransition(item, {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }}
            >
              <span className="nav-menu__index">{item.index}</span>
              <span className="nav-menu__label">{item.label}</span>
              <span className="nav-menu__preview">{PREVIEWS[item.href]}</span>
            </button>
          );
        })}
      </nav>

      <footer className="nav-menu__foot">
        <p className="nav-menu__foot-note">Selected work · Briefs · Studio</p>
      </footer>
    </div>
  );
}
