import type { NeonGlowButtonProps } from "@/components/motion/neon-glow-button";

/** Ink / spark portfolio defaults for dark surfaces. */
export const NEON_GLOW_PORTFOLIO: Partial<NeonGlowButtonProps> = {
  colors: {
    fill: "#0b1f4d",
    hoverFill: "#132e62",
    textColor: "#ffffff",
    hoverTextColor: "#93c5fd",
  },
  glow: { blur: 5, size: 6, color: "#2563ff" },
  border: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#2563ff",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  padding: "0.85rem 1.55rem",
  rounded: 100,
  addIcon: true,
  icon: {
    side: "right",
    size: 14,
    type: "symbol",
    symbol: "↗",
    color: "#ffffff",
    hoverColor: "#93c5fd",
  },
  font: {
    fontFamily: "var(--font-satoshi), sans-serif",
    fontWeight: 600,
    fontSize: "0.74rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
};

/** Soft neon on cream / light panels. */
export const NEON_GLOW_LIGHT: Partial<NeonGlowButtonProps> = {
  ...NEON_GLOW_PORTFOLIO,
  colors: {
    fill: "#0b1f4d",
    hoverFill: "#2563ff",
    textColor: "#f7f4ec",
    hoverTextColor: "#ffffff",
  },
};
