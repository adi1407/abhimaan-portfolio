import { Suspense } from "react";
import { SiteNav } from "@/components/layout/site-nav";
import { NavMenu } from "@/components/layout/nav-menu";
import { NavCursor } from "@/components/layout/nav-cursor";
import { PageTransition } from "@/components/layout/page-transition";
import { SITE } from "@/lib/constants";

/** Stable chrome while `useSearchParams` suspends — never blank the bar. */
function NavShellFallback() {
  return (
    <header className="site-nav site-nav--top" aria-hidden>
      <div className="site-nav__shell">
        <span className="nav-logo">
          <span className="nav-logo__dot" />
          <span className="nav-logo__text">{SITE.name}</span>
        </span>
        <span className="site-nav__center" />
        <span className="site-nav__end">
          <span className="nav-burger" aria-hidden>
            <span className="nav-burger__box">
              <span />
              <span />
            </span>
          </span>
        </span>
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <>
      <Suspense fallback={<NavShellFallback />}>
        <SiteNav />
        <NavMenu />
      </Suspense>
      <NavCursor />
      <PageTransition />
    </>
  );
}
