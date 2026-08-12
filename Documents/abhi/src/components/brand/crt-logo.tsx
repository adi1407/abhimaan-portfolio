"use client";

import Image from "next/image";
import { SITE, SITE_LOGO } from "@/lib/constants";
import { useSettings } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * ABHI CRT logo — navbar brand mark with soft bloom + chromatic fringe.
 * ================================================================== */

type CrtLogoProps = {
  className?: string;
  priority?: boolean;
  /** Decorative only when the parent already names the brand. */
  decorative?: boolean;
};

export function CrtLogo({
  className,
  priority = false,
  decorative = false,
}: CrtLogoProps) {
  const settings = useSettings<{ name?: string; logo?: string }>();
  const name = settings.name || SITE.name;
  const logo = settings.logo || SITE_LOGO;
  return (
    <span
      className={cn("crt-logo", className)}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": `${name} — ABHI Design` })}
    >
      <span
        className="crt-logo__bloom"
        aria-hidden
        style={{ backgroundImage: `url("${logo}")` }}
      />
      <span
        className="crt-logo__rgb crt-logo__rgb--r"
        aria-hidden
        style={{ backgroundImage: `url("${logo}")` }}
      />
      <span
        className="crt-logo__rgb crt-logo__rgb--b"
        aria-hidden
        style={{ backgroundImage: `url("${logo}")` }}
      />

      <Image
        src={logo}
        alt=""
        width={480}
        height={192}
        className="crt-logo__img"
        priority={priority}
        unoptimized={logo.startsWith("/api/")}
        sizes="(max-width: 720px) 8.5rem, 11.5rem"
      />

      <span className="crt-logo__scan" aria-hidden />
      <span className="crt-logo__glow" aria-hidden />
    </span>
  );
}
