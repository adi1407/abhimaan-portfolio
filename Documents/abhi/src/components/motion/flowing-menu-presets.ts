export type FlowingMenuPreset = {
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
};

export const FLOWING_MENU_NAV: FlowingMenuPreset = {
  speed: 14,
  textColor: "#ffffff",
  bgColor: "transparent",
  marqueeBgColor: "#f7f4ec",
  marqueeTextColor: "#0b1f4d",
  borderColor: "rgba(255, 255, 255, 0.14)",
};

export const FLOWING_MENU_DARK: FlowingMenuPreset = {
  speed: 12,
  textColor: "#ffffff",
  bgColor: "transparent",
  marqueeBgColor: "#2563ff",
  marqueeTextColor: "#ffffff",
  borderColor: "rgba(255, 255, 255, 0.14)",
};

/** Curated marquee stills — editorial, desaturated, portfolio-safe. */
export const NAV_FLOW_IMAGES: Record<string, string> = {
  "/": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=600&h=400&fit=crop&sat=-25&auto=format",
  "/about": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&h=400&fit=crop&sat=-20&auto=format",
  "/work": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&fit=crop&sat=-15&auto=format",
  "/works": "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&h=400&fit=crop&sat=-20&auto=format",
  "/contact": "https://images.unsplash.com/photo-1423666639041-f56000c27a9e?q=80&w=600&h=400&fit=crop&sat=-25&auto=format",
};

export const CATEGORY_FLOW_IMAGES: Record<string, string> = {
  posters: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&fit=crop&sat=-15&auto=format",
  thumbnails: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&h=400&fit=crop&sat=-20&auto=format",
  logos: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&h=400&fit=crop&sat=-15&auto=format",
  books: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&h=400&fit=crop&sat=-20&auto=format",
};
