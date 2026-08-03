import { SITE_IMAGE } from "@/lib/constants";

export type FunDesign = {
  id: string;
  title: string;
  note: string;
  /** Resting rotation in degrees. */
  rot: number;
  /** Orbit phase offset in turns (0–1). */
  phase: number;
  /** Orbit radius as % of stage half-size. */
  radius: number;
  /** Orbit speed multiplier (relative). */
  speed: number;
  /** Path under /public */
  src: string;
  /** Behance project — opens on click (when not dragged). */
  href: string;
};

/** Five equal desk scraps — `public/one.png` … `five.png`. */
export const FUN_DESIGNS: readonly FunDesign[] = [
  {
    id: "01",
    title: "GodLike BGIS",
    note: "2026 creatives",
    rot: -7,
    phase: 0,
    radius: 34,
    speed: 1,
    src: "/one.png",
    href: "https://www.behance.net/gallery/242927523/GODLIKE-BGIS-2026-CREATIVES",
  },
  {
    id: "02",
    title: "True Rippers",
    note: "PMGC 2025",
    rot: 5,
    phase: 1 / 5,
    radius: 36,
    speed: 0.92,
    src: "/two.png",
    href: "https://www.behance.net/gallery/238835321/TRUE-RIPPERS-PMGC-2025",
  },
  {
    id: "03",
    title: "Elite Clash Cup",
    note: "2025",
    rot: -4,
    phase: 2 / 5,
    radius: 33,
    speed: 1.08,
    src: "/three.png",
    href: "https://www.behance.net/gallery/232699585/ELITE-CLASH-CUP-2025",
  },
  {
    id: "04",
    title: "GodLike Jersey",
    note: "2026/27 redesign",
    rot: 8,
    phase: 3 / 5,
    radius: 37,
    speed: 0.88,
    src: "/four.png",
    href: "https://www.behance.net/gallery/231435887/GODLIKE-JERSEY-REDESIGN-FOR-202627",
  },
  {
    id: "05",
    title: "iQOO Soul",
    note: "BMSD tournament",
    rot: -6,
    phase: 4 / 5,
    radius: 35,
    speed: 1.05,
    src: "/five.png",
    href: "https://www.behance.net/gallery/236087069/IQOO-SOUL-BMSD-TOURNAMENT-DESIGN",
  },
] as const;

/** Prefer scrap path; UI falls back to SITE_IMAGE on load error. */
export function funScrapSrc(design: FunDesign) {
  return design.src || SITE_IMAGE;
}

export const FUN_CENTER_LINES = [
  "Behance work",
  "Selected creatives",
  "Desk scraps",
  "Made for the feed",
] as const;
