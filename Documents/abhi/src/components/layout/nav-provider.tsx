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
import type { NavItem, NavTheme } from "@/types";
import { getNavItemByHref } from "@/lib/nav";

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
  cue: string;
  accent: string;
  theme: NavTheme;
  /** Target route, so a transition can be specific to where it's going. */
  href: string;
  x: number;
  y: number;
  phase: TransitionPhase;
  /** Bumps each trip so the circle DOM remounts and expand always replays. */
  runId: number;
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
export const PT_EXPAND_MS = 760;
export const PT_LABEL_MS = 380;
export const PT_HOLD_MS = 420;
export const PT_COLLAPSE_MS = 560;

const IDLE: TransitionState = {
  active: false,
  label: "",
  index: "",
  cue: "",
  accent: "#2f6bff",
  theme: "home",
  href: "",
  x: 0,
  y: 0,
  phase: "idle",
  runId: 0,
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
  const runId = useRef(0);
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
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const nextRun = (runId.current += 1);

      router.prefetch(item.href);

      const reduced = prefersReducedMotion();
      const expandMs = reduced ? 16 : PT_EXPAND_MS;
      const labelMs = reduced ? 16 : PT_LABEL_MS;
      const holdMs = reduced ? 16 : PT_HOLD_MS;
      const collapseMs = reduced ? 16 : PT_COLLAPSE_MS;
      // Cover must be opaque before the route swaps underneath.
      const pushAt = reduced ? 16 : Math.round(expandMs * 0.74);

      setTransition({
        active: true,
        label: navItem.label,
        index: navItem.index,
        cue: navItem.cue || item.cue,
        accent: navItem.accent || item.accent,
        theme: navItem.theme || item.theme,
        href: item.href,
        x,
        y,
        phase: "expand",
        runId: nextRun,
      });

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "label" }));
      }, expandMs * 0.4);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "navigate" }));
        router.push(item.href);
      }, pushAt);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "hold" }));
      }, expandMs + labelMs * 0.3);

      schedule(() => {
        setTransition((t) => ({ ...t, phase: "collapse" }));
      }, expandMs + labelMs + holdMs);

      schedule(() => {
        setTransition((t) => ({
          ...IDLE,
          accent: t.accent,
          theme: t.theme,
          runId: t.runId,
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
