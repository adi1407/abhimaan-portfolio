"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CrtLogo } from "@/components/brand/crt-logo";
import { onViewport } from "@/lib/frame";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/constants";
import { NAV_ITEMS, getNavItemByHref } from "@/lib/nav";
import { useNav } from "@/components/layout/nav-provider";
import { NavFlipLink } from "@/components/layout/nav-flip-link";
import { NavCta } from "@/components/layout/nav-cta";

type Pill = { left: number; width: number; ready: boolean };

export function SiteNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    menuOpen,
    setMenuOpen,
    setCursorExpanded,
    navigateWithTransition,
    transition,
  } = useNav();
  const navBusy = transition.active;

  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pill, setPill] = useState<Pill>({ left: 0, width: 0, ready: false });

  const shellRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const lastY = useRef(0);
  const pinnedRef = useRef(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locationKey =
    searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  const active = getNavItemByHref(locationKey);
  const target = hovered ?? active.href;
  const open = !compact || expanded || pinned || menuOpen;

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const measurePill = useCallback(() => {
    const list = listRef.current;
    const li = itemRefs.current.get(target);
    if (!list || !li) return;
    const listRect = list.getBoundingClientRect();
    const liRect = li.getBoundingClientRect();
    setPill({
      left: liRect.left - listRect.left,
      width: liRect.width,
      ready: true,
    });
  }, [target]);

  useLayoutEffect(measurePill, [measurePill, compact, expanded, pinned, open]);

  // Remeasure after expand morph so the active pill settles cleanly.
  useEffect(() => {
    if (!open) return;
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        measurePill();
      });
    });
    const settle = window.setTimeout(measurePill, 500);
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      window.clearTimeout(settle);
    };
  }, [open, compact, measurePill]);

  useEffect(() => {
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, [measurePill]);

  useEffect(() => {
    document.fonts?.ready.then(measurePill).catch(() => {});
  }, [measurePill]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  useEffect(() => {
    lastY.current = window.scrollY;

    /* Shared frame loop — the nav no longer keeps its own scroll
       listener + rAF; scroll position is measured once per frame for
       the whole page and handed to every subscriber. */
    return onViewport(({ scrollY: y, vh }) => {
      const delta = y - lastY.current;
      const max = document.documentElement.scrollHeight - vh;

      if (y > 48) setCompact(true);
      else if (y < 24) {
        setCompact(false);
        setExpanded(false);
        setPinned(false);
      }

      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);

      // Scroll-down while pinned → unpin and collapse.
      if (pinnedRef.current && delta > 8 && y > 64) {
        setPinned(false);
        setExpanded(false);
      }

      lastY.current = y;
    });
  }, []);

  // Esc / outside click clears pin (and closes menu via existing handler).
  useEffect(() => {
    if (!pinned && !menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      setPinned(false);
      setExpanded(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!pinned) return;
      const shell = shellRef.current;
      if (shell && !shell.contains(e.target as Node)) {
        setPinned(false);
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pinned, menuOpen, setMenuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Quiet magnetic pull on the compact nameplate — lerped for smooth tracking.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !compact || open) {
      shell?.style.setProperty("--mag-x", "0px");
      shell?.style.setProperty("--mag-y", "0px");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      if (Math.abs(targetX - currentX) < 0.02) currentX = targetX;
      if (Math.abs(targetY - currentY) < 0.02) currentY = targetY;
      shell.style.setProperty("--mag-x", `${currentX.toFixed(2)}px`);
      shell.style.setProperty("--mag-y", `${currentY.toFixed(2)}px`);
      if (currentX !== targetX || currentY !== targetY) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 120));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 80));
      targetX = dx * 3;
      targetY = dy * 2;
      kick();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      kick();
    };

    window.addEventListener("pointermove", onMove);
    shell.addEventListener("pointerleave", onLeave);
    return () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      shell.removeEventListener("pointerleave", onLeave);
      shell.style.setProperty("--mag-x", "0px");
      shell.style.setProperty("--mag-y", "0px");
    };
  }, [compact, open]);

  const onShellEnter = () => {
    clearLeaveTimer();
    if (compact) setExpanded(true);
  };

  const onShellLeave = () => {
    if (pinnedRef.current || menuOpen) return;
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      setExpanded(false);
      leaveTimer.current = null;
    }, 220);
  };

  const onLogoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Compact + collapsed → pin open (first interaction).
    if (compact && !open) {
      e.preventDefault();
      setPinned(true);
      setExpanded(true);
      return;
    }

    // Compact + open + pinned → toggle pin off if clicking again without navigating?
    // Plan: name click while expanded navigates home.
    const rect = e.currentTarget.getBoundingClientRect();
    navigateWithTransition(NAV_ITEMS[0], {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <header
      className={cn(
        "site-nav",
        compact ? "site-nav--compact" : "site-nav--top",
        compact && open && "site-nav--expanded",
        pinned && "site-nav--pinned",
        `site-nav--theme-${active.theme}`,
      )}
      style={
        {
          ["--nav-progress" as string]: progress,
          ["--nav-accent" as string]: active.accent,
        } as CSSProperties
      }
    >
      <div
        ref={shellRef}
        className="site-nav__shell"
        onPointerEnter={onShellEnter}
        onPointerLeave={onShellLeave}
      >
        <button
          type="button"
          className="nav-logo"
          aria-label={
            compact && !open
              ? `${SITE.name} — expand navigation`
              : `${SITE.name} — home`
          }
          aria-expanded={compact ? open : undefined}
          onMouseEnter={() => setCursorExpanded(true)}
          onMouseLeave={() => setCursorExpanded(false)}
          onClick={onLogoClick}
        >
          <CrtLogo priority decorative />
        </button>

        <nav
          aria-label="Primary"
          className="site-nav__center"
          inert={compact && !open ? true : undefined}
        >
          <ul
            ref={listRef}
            className="nav-list"
            onMouseLeave={() => setHovered(null)}
          >
            <li
              aria-hidden
              className={cn("nav-pill", pill.ready && open && "is-ready")}
              style={{ left: pill.left, width: pill.width }}
            />
            {NAV_ITEMS.map((item, i) => (
              <li
                key={item.href}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.href, el);
                  else itemRefs.current.delete(item.href);
                }}
                style={{ ["--i" as string]: i }}
              >
                <NavFlipLink
                  item={item}
                  active={item.href === active.href}
                  onHoverChange={(on) => setHovered(on ? item.href : null)}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div
          className="site-nav__end"
          inert={compact && !open ? true : undefined}
        >
          <NavCta />
          <button
            type="button"
            className="nav-burger"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            disabled={navBusy}
            onClick={() => {
              if (navBusy) return;
              setMenuOpen(!menuOpen);
            }}
            onMouseEnter={() => setCursorExpanded(true)}
            onMouseLeave={() => setCursorExpanded(false)}
          >
            <span className={cn("nav-burger__box", menuOpen && "is-open")}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
