"use client";

import {
  useRef,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import "./flowing-menu.css";

export type FlowingMenuItem = {
  text: string;
  image: string;
  link?: string;
  external?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export type FlowingMenuProps = {
  items?: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  className?: string;
  variant?: "default" | "compact";
};

const ANIMATION_DEFAULTS = { duration: 0.6, ease: "expo.out" };

function distMetric(x: number, y: number, x2: number, y2: number) {
  const xDiff = x - x2;
  const yDiff = y - y2;
  return xDiff * xDiff + yDiff * yDiff;
}

function findClosestEdge(
  mouseX: number,
  mouseY: number,
  width: number,
  height: number,
) {
  const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
  const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
  return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
}

type MenuItemProps = FlowingMenuItem & {
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
  reducedMotion: boolean;
};

function MenuItem({
  link,
  external,
  text,
  image,
  onClick,
  disabled,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  reducedMotion,
}: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;

      const marqueeContent = marqueeInnerRef.current.querySelector(
        ".flowing-menu__part",
      );
      if (!marqueeContent) return;

      const contentWidth = (marqueeContent as HTMLElement).offsetWidth;
      const viewportWidth = window.innerWidth;
      const needed = Math.ceil(viewportWidth / contentWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text, image]);

  useEffect(() => {
    if (reducedMotion) return;

    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;

      const marqueeContent = marqueeInnerRef.current.querySelector(
        ".flowing-menu__part",
      );
      if (!marqueeContent) return;

      const contentWidth = (marqueeContent as HTMLElement).offsetWidth;
      if (contentWidth === 0) return;

      if (animationRef.current) {
        animationRef.current.kill();
      }

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = window.setTimeout(setupMarquee, 50);

    return () => {
      window.clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [text, image, repetitions, speed, reducedMotion]);

  const handleMouseEnter = (ev: MouseEvent<HTMLElement>) => {
    if (reducedMotion) {
      if (marqueeRef.current) marqueeRef.current.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: ANIMATION_DEFAULTS })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(
        marqueeInnerRef.current,
        { y: edge === "top" ? "101%" : "-101%" },
        0,
      )
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: MouseEvent<HTMLElement>) => {
    if (reducedMotion) {
      if (marqueeRef.current) marqueeRef.current.style.transform = "translate3d(0, 101%, 0)";
      return;
    }

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap
      .timeline({ defaults: ANIMATION_DEFAULTS })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(
        marqueeInnerRef.current,
        { y: edge === "top" ? "101%" : "-101%" },
        0,
      );
  };

  const interactiveProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    style: { color: textColor },
    disabled,
  };

  let trigger: ReactNode;

  if (onClick) {
    trigger = (
      <button
        type="button"
        className="flowing-menu__link"
        {...interactiveProps}
        onClick={(e) => {
          if (disabled) return;
          onClick(e);
        }}
      >
        {text}
      </button>
    );
  } else if (link) {
    trigger = (
      <a
        className="flowing-menu__link"
        href={link}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </a>
    );
  } else {
    trigger = (
      <span
        className="flowing-menu__link"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </span>
    );
  }

  return (
    <div
      className="flowing-menu__item"
      ref={itemRef}
      style={{ borderColor }}
    >
      {trigger}
      <div
        className="flowing-menu__marquee"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="flowing-menu__marquee-wrap">
          <div
            className="flowing-menu__marquee-inner"
            ref={marqueeInnerRef}
            aria-hidden="true"
          >
            {[...Array(repetitions)].map((_, idx) => (
              <div
                className="flowing-menu__part"
                key={idx}
                style={{ color: marqueeTextColor }}
              >
                <span>{text}</span>
                <div
                  className="flowing-menu__img"
                  style={{ backgroundImage: `url(${image})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlowingMenu({
  items = [],
  speed = 15,
  textColor = "#fff",
  bgColor = "#120F17",
  marqueeBgColor = "#fff",
  marqueeTextColor = "#120F17",
  borderColor = "#fff",
  className,
  variant = "default",
}: FlowingMenuProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flowing-menu",
        variant === "compact" && "flowing-menu--compact",
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      <nav className="flowing-menu__nav" aria-label="Flowing menu">
        {items.map((item, idx) => (
          <MenuItem
            key={`${item.text}-${idx}`}
            {...item}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            reducedMotion={reducedMotion}
          />
        ))}
      </nav>
    </div>
  );
}
