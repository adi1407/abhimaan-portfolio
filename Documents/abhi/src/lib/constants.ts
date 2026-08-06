export const SITE = {
  name: "Abhimaan",
  description: "Portfolio — art direction, identity & visual design",
} as const;

/** Featured creative — used for OG/favicon and image fallbacks. */
export const SITE_IMAGE = "/work/p-01.jpg" as const;

/** ABHI CRT brand mark — navbar + footer. */
export const SITE_LOGO = "/brand/abhi-crt-logo.png" as const;

/** Public inbox — shown on the contact page only. */
export const EMAIL = "hello@abhimaan.studio" as const;

export const ROUTES = {
  index: "/",
  about: "/about",
  /** Dedicated film → panels → gallery page. */
  work: "/work",
  works: "/works",
  contact: "/contact",
} as const;
