export type NavTheme = "home" | "about" | "work" | "works" | "contact";

export type NavItem = {
  label: string;
  href: string;
  index: string;
  /** Short editorial line under the route title during the wipe. */
  cue: string;
  /** Accent used by the wipe field + nav theming. */
  accent: string;
  theme: NavTheme;
};
