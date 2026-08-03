"use client";

import { useRef } from "react";
import { useNav } from "@/components/layout/nav-provider";
import { getNavItemByHref } from "@/lib/nav";
import { ROUTES } from "@/lib/constants";

/**
 * Magnetic "Let's talk" pill. The whole button drifts toward the cursor and
 * the label wipes upward to reveal a duplicate — same flip vocabulary as the
 * nav links, at a heavier weight.
 */
export function NavCta() {
  const { navigateWithTransition, setCursorExpanded } = useNav();
  const btnRef = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
  };

  const reset = () => {
    if (btnRef.current) btnRef.current.style.transform = "";
    setCursorExpanded(false);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className="nav-cta"
      onMouseMove={onMove}
      onMouseEnter={() => setCursorExpanded(true)}
      onMouseLeave={reset}
      onFocus={() => setCursorExpanded(true)}
      onBlur={reset}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        navigateWithTransition(getNavItemByHref(ROUTES.contact), {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
    >
      <span className="nav-cta__status" aria-hidden />
      <span className="nav-cta__flip">
        <span className="nav-cta__track">
          <span className="nav-cta__line">Let&rsquo;s talk</span>
          <span className="nav-cta__line" aria-hidden>
            Let&rsquo;s talk
          </span>
        </span>
      </span>
    </button>
  );
}
