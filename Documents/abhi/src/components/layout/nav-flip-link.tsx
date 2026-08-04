"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useNav } from "@/components/layout/nav-provider";
import type { NavItem } from "@/types";

type NavFlipLinkProps = {
  item: NavItem;
  active?: boolean;
  className?: string;
  onHoverChange?: (hovering: boolean) => void;
  onNavigate?: () => void;
};

/**
 * A nav item that flips its label on hover while leaning magnetically toward
 * the cursor. The highlight pill behind it is owned by SiteNav, so this only
 * reports hover state upward rather than drawing its own background.
 */
export function NavFlipLink({
  item,
  active,
  className,
  onHoverChange,
  onNavigate,
}: NavFlipLinkProps) {
  const { navigateWithTransition, setCursorExpanded } = useNav();
  const magRef = useRef<HTMLSpanElement>(null);

  const isReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isReduced() || !magRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    magRef.current.style.transform = `translate(${x * 0.18}px, ${y * 0.2}px)`;
  };

  const enter = () => {
    setCursorExpanded(true);
    onHoverChange?.(true);
  };

  const leave = () => {
    if (magRef.current) magRef.current.style.transform = "";
    setCursorExpanded(false);
    onHoverChange?.(false);
  };

  return (
    <button
      type="button"
      className={cn("nav-link", active && "is-active", className)}
      aria-current={active ? "page" : undefined}
      onMouseMove={onMove}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        navigateWithTransition(item, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        onNavigate?.();
      }}
    >
      <span ref={magRef} className="nav-mag">
        <span className="nav-flip">
          <span className="nav-flip__track">
            <span className="nav-flip__line">
              {item.label.split("").map((char, i) => (
                <span
                  key={`a-${i}`}
                  className="nav-flip__char"
                  style={{ ["--i" as string]: i }}
                >
                  {char}
                </span>
              ))}
            </span>
            <span className="nav-flip__line" aria-hidden>
              {item.label.split("").map((char, i) => (
                <span
                  key={`b-${i}`}
                  className="nav-flip__char"
                  style={{ ["--i" as string]: i }}
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
