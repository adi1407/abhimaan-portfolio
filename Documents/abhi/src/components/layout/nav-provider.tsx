"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { NavItem } from "@/types";
import { getNavItemByHref, NAV_POSTERS } from "@/lib/nav";

type TransitionPhase =
  | "idle"
  | "expand"
  | "label"
  | "navigate"
  | "hold"
  | "collapse";

type TransitionState = {
  active: boolean;
  label: string;
  index: string;
  poster: string;
  x: number;
  y: number;
  phase: TransitionPhase;
};

type NavContextValue = {
  transition: TransitionState;
  cursorExpanded: boolean;
  setCursorExpanded: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  navigateWithTransition: (
    item: NavItem,
    origin?: { x: number; y: number },
  ) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

/** Keep CSS `--pt-*` vars in sync with these. */
export const PT_EXPAND_MS = 560;
export const PT_LABEL_MS = 340;
/** Beat after the page lands — poster breathes before the wipe opens. */
export const PT_HOLD_MS = 420;
export const PT_COLLAPSE_MS = 480;

const IDLE: TransitionState = {
  active: false,
  label: "",
  index: "",
  poster: NAV_POSTERS[0] ?? "/one.png",
  x: 0,
  y: 0,
  phase: "idle",
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const [menuOpen, setMenuOpenState] = useState(false);
  const [cursorExpanded, setCursorExpanded] = useState(false);
  const [transition, setTransition] = useState<TransitionState>(IDLE);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  // Warm Behance poster decode so the first wipe never flashes empty.
  useEffect(() => {
    const unique = [...new Set(NAV_POSTERS)];
    unique.forEach((src) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const setMenuOpen = useCallback((v: boolean) => {
    if (v && busy.current) return;
    setMenuOpenState(v);
  }, []);

  const navigateWithTransition = useCallback(
    (item: NavItem, origin?: { x: number; y: number }) => {
      if (busy.current) return;
      if (typeof window !== "undefined") {
        const target = new URL(item.href, window.location.origin);
        if (
          window.location.pathname === target.pathname &&
          window.location.search === target.search
        ) {
          setMenuOpenState(false);
          return;
        }
      }

      busy.current = true;
      setMenuOpenState(false);
      clearTimers();

      const navItem = getNavItemByHref(item.href);
      const poster = navItem.poster || item.poster;
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;

      router.prefetch(item.href);

      const reduced = prefersReducedMotion();
      const expandMs = reduced ? 16 : PT_EXPAND_MS;
      const labelMs = reduced ? 16 : PT_LABEL_MS;
      const holdMs = reduced ? 16 : PT_HOLD_MS;
      const collapseMs = reduced ? 16 : PT_COLLAPSE_MS;
      const pushAt = reduced ? 16 : Math.round(expandMs * 0.88);

      setTransition({
        active: true,
        label: navItem.label,
        index: navItem.index,
        poster,
        x,
        y,
        phase: "expand",
      });

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "label" }));
      }, expandMs * 0.38);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "navigate" }));
        router.push(item.href);
      }, pushAt);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "hold" }));
      }, expandMs + labelMs * 0.55);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "collapse" }));
      }, expandMs + labelMs + holdMs);

      schedule(() => {
        setTransition((t) => ({
          ...IDLE,
          poster: t.poster,
        }));
        busy.current = false;
      }, expandMs + labelMs + holdMs + collapseMs);
    },
    [router, clearTimers, schedule],
  );

  const value = useMemo(
    () => ({
      transition,
      cursorExpanded,
      setCursorExpanded,
      menuOpen,
      setMenuOpen,
      navigateWithTransition,
    }),
    [
      transition,
      cursorExpanded,
      menuOpen,
      setMenuOpen,
      navigateWithTransition,
    ],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}
