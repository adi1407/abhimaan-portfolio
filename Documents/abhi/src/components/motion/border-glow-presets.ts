export type BorderGlowPreset = {
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  colors?: string[];
  fillOpacity?: number;
};

export const BORDER_GLOW_LIGHT: BorderGlowPreset = {
  backgroundColor: "#f7f4ec",
  glowColor: "220 35 28",
  colors: ["#2563ff", "#38bdf8", "#0b1f4d"],
  borderRadius: 20,
  glowRadius: 32,
  glowIntensity: 0.85,
  edgeSensitivity: 28,
  coneSpread: 22,
  fillOpacity: 0.35,
};

export const BORDER_GLOW_DARK: BorderGlowPreset = {
  backgroundColor: "#0b1f4d",
  glowColor: "210 75 78",
  colors: ["#2563ff", "#60a5fa", "#c4b5fd"],
  borderRadius: 24,
  glowRadius: 40,
  glowIntensity: 1,
  edgeSensitivity: 30,
  coneSpread: 25,
  fillOpacity: 0.5,
};

export const BORDER_GLOW_BOOK: BorderGlowPreset = {
  backgroundColor: "#0b0d14",
  glowColor: "220 70 70",
  colors: ["#2563ff", "#38bdf8", "#f7f4ec"],
  borderRadius: 6,
  glowRadius: 28,
  glowIntensity: 0.9,
  edgeSensitivity: 26,
  coneSpread: 22,
  fillOpacity: 0.4,
};
