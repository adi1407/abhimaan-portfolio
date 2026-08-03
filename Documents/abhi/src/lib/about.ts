export type CreateWord = {
  word: string;
  /** Drives which meaning-based transition the word uses. */
  motion: "assemble" | "slide" | "stack" | "shuffle" | "grid" | "expand";
  note: string;
};

/** Each word enters with an animation that argues its own meaning. */
export const CREATE_WORDS: readonly CreateWord[] = [
  { word: "Brands.", motion: "assemble", note: "built from modular parts" },
  { word: "Posters.", motion: "slide", note: "printed sheets, stacked" },
  { word: "Socials.", motion: "stack", note: "a feed with one voice" },
  { word: "Thumbnails.", motion: "shuffle", note: "frames that stop a scroll" },
  { word: "Identities.", motion: "grid", note: "aligned to a system" },
  { word: "Experiences.", motion: "expand", note: "space you move through" },
] as const;

export type Tool = {
  id: string;
  name: string;
  short: string;
  /** Vendor palette — drawn, not imported, so no trademarked assets ship. */
  bg: string;
  fg: string;
  serial: string;
  skills: readonly string[];
};

export const TOOLS: readonly Tool[] = [
  {
    id: "ps",
    name: "Photoshop",
    short: "Ps",
    bg: "#001E36",
    fg: "#31A8FF",
    serial: "RASTER / 01",
    skills: ["Photo Manipulation", "Social Creatives", "Compositing"],
  },
  {
    id: "ai",
    name: "Illustrator",
    short: "Ai",
    bg: "#330000",
    fg: "#FF9A00",
    serial: "VECTOR / 02",
    skills: ["Vector Systems", "Logo Design", "Brand Identity"],
  },
  {
    id: "fig",
    name: "Figma",
    short: "Fi",
    bg: "#161616",
    fg: "#0ACF83",
    serial: "INTERFACE / 03",
    skills: ["Interface Design", "Layout Systems", "Prototyping"],
  },
  {
    id: "ae",
    name: "After Effects",
    short: "Ae",
    bg: "#00005B",
    fg: "#9999FF",
    serial: "MOTION / 04",
    skills: ["Motion Graphics", "Animated Identity", "Visual Motion"],
  },
] as const;

export type Principle = {
  id: string;
  title: string;
  line: string;
};

export const DNA: readonly Principle[] = [
  { id: "01", title: "Story", line: "Ideas before decoration." },
  { id: "02", title: "System", line: "Consistency across every visual." },
  {
    id: "03",
    title: "Detail",
    line: "Typography, spacing and composition matter.",
  },
  {
    id: "04",
    title: "Impact",
    line: "Design should communicate before it impresses.",
  },
] as const;

export type UniversePiece = {
  id: string;
  label: string;
  kind: "identity" | "logo" | "social" | "poster" | "thumbnail" | "art" | "campaign";
  /** Depth plane: 0 = far background … 2 = foreground (drives parallax). */
  depth: 0 | 1 | 2;
  x: number; // % of stage width
  y: number; // % of stage height
  rotate: number;
};

/** Miniature work suspended at different depths — the creative workspace. */
export const UNIVERSE: readonly UniversePiece[] = [
  { id: "u1", label: "Brand identity", kind: "identity", depth: 0, x: 12, y: 22, rotate: -6 },
  { id: "u2", label: "Logo design", kind: "logo", depth: 1, x: 80, y: 16, rotate: 5 },
  { id: "u3", label: "Social creative", kind: "social", depth: 2, x: 22, y: 68, rotate: 4 },
  { id: "u4", label: "Poster", kind: "poster", depth: 1, x: 62, y: 72, rotate: -5 },
  { id: "u5", label: "Thumbnail", kind: "thumbnail", depth: 2, x: 86, y: 52, rotate: 7 },
  { id: "u6", label: "Digital artwork", kind: "art", depth: 0, x: 44, y: 12, rotate: 3 },
  { id: "u7", label: "Campaign", kind: "campaign", depth: 1, x: 6, y: 48, rotate: 6 },
] as const;

export const ACTS = [
  { id: "intro", label: "Intro" },
  { id: "story", label: "Story" },
  { id: "create", label: "Create" },
  { id: "approach", label: "Approach" },
  { id: "tools", label: "Tools" },
  { id: "dna", label: "DNA" },
] as const;
