import { Inter, Unbounded } from "next/font/google";

/**
 * The site runs on one typeface: SF Pro.
 *
 * Apple does not license SF Pro as a webfont, so it can only be reached
 * through the system stack (`-apple-system`), which resolves on Apple
 * hardware and nowhere else. Inter is the stand-in for everyone else — it was
 * drawn against the same proportions, so weights, x-height and advance widths
 * line up closely enough that a layout tuned on one reads the same on the
 * other. It is self-hosted by next/font, so there is no request to Google.
 *
 * Both axes are variable: `wght` 100–900 lets every role (hairline signature
 * through black display) come out of a single file, and `opsz` lets the
 * drawing tighten itself as type gets larger, which is what SF does natively.
 *
 * Unbounded is reserved for the cinema hero wordmark only — a black display
 * cut that gives ABHIMAAN more presence than body SF/Inter.
 *
 * The full stack lives in globals.css as `--font-sf-pro`; every other
 * `--font-*` token is an alias of it, so roles are separated by weight,
 * size and tracking rather than by family.
 */
export const inter = Inter({
  variable: "--ff-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const unbounded = Unbounded({
  variable: "--ff-unbounded",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

/** Spread onto <html> to register the families. */
export const fontVariables = `${inter.variable} ${unbounded.variable}`;
