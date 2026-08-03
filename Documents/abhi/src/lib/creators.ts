export type Creator = {
  name: string;
  /** File stem under /public/creators/ — tries .jpg, .jpeg, .webp, .png */
  slug: string;
  href?: string;
};

/**
 * Creators Abhimaan has worked with.
 * Drop a photo at public/creators/{slug}.jpg (or .jpeg / .webp / .png).
 * Missing files fall back to a monogram avatar automatically.
 */
export const CREATORS: readonly Creator[] = [
  { name: "Godlike", slug: "godlike" },
  { name: "Scout", slug: "scout" },
  { name: "Mavi Soul", slug: "mavi-soul" },
  { name: "8BitMamba", slug: "8bitmamba" },
  { name: "S8UL", slug: "s8ul" },
  { name: "Rebel", slug: "rebel" },
  { name: "Mizo", slug: "mizo" },
  { name: "Willy", slug: "willy" },
  { name: "Lenstrack", slug: "lenstrack" },
] as const;

export function creatorPhotoCandidates(slug: string) {
  return [
    `/creators/${slug}.jpg`,
    `/creators/${slug}.jpeg`,
    `/creators/${slug}.webp`,
    `/creators/${slug}.png`,
  ] as const;
}

export function creatorInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
