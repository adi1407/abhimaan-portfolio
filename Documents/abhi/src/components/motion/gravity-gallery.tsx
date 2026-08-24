"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Matter from "matter-js";
import { cn } from "@/lib/cn";

export type GravityImage = {
  src: string;
  alt?: string;
};

export type GravityGalleryProps = {
  images?: GravityImage[];
  count?: number;
  size?: number;
  shape?: "square" | "circle";
  color?: string;
  friction?: number;
  mouseEnable?: boolean;
  mouseStiffness?: number;
  mouseAngularStiffness?: number;
  gravX?: number;
  gravY?: number;
  wallOptions?: {
    top?: boolean;
    bottom?: boolean;
    right?: boolean;
    left?: boolean;
  };
  className?: string;
  style?: CSSProperties;
};

const {
  Engine,
  Bodies,
  Composite,
  Mouse,
  MouseConstraint,
  World,
} = Matter;

function makeWalls(
  bounding: { width: number; height: number },
  world: Matter.World,
  opts: { top?: boolean; bottom?: boolean; right?: boolean; left?: boolean },
) {
  const { width: w, height: h } = bounding;
  const t = 200;
  const walls: Matter.Body[] = [];
  if (opts.top) {
    walls.push(
      Bodies.rectangle(w / 2, -t / 2, w + 2 * t, t, { isStatic: true }),
    );
  }
  if (opts.bottom) {
    walls.push(
      Bodies.rectangle(w / 2, h + t / 2, w + 2 * t, t, { isStatic: true }),
    );
  }
  if (opts.left) {
    walls.push(
      Bodies.rectangle(-t / 2, h / 2, t, h + 2 * t, { isStatic: true }),
    );
  }
  if (opts.right) {
    walls.push(
      Bodies.rectangle(w + t / 2, h / 2, t, h + 2 * t, { isStatic: true }),
    );
  }
  Composite.add(world, walls);
  return walls;
}

export function GravityGallery({
  images = [],
  count = 12,
  size = 110,
  shape = "square",
  color = "#0b1f4d",
  friction = 1,
  mouseEnable = true,
  mouseStiffness = 0.991,
  mouseAngularStiffness = 0,
  gravX = 0,
  gravY = 1,
  wallOptions = { top: true, bottom: true, right: true, left: true },
  className,
  style,
}: GravityGalleryProps) {
  const n = Math.max(1, Math.min(20, Math.round(count)));
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setBounds((prev) =>
        Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
          ? prev
          : { w: width, h: height },
      );
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const depKey = JSON.stringify({
    n,
    size,
    shape,
    gravX,
    gravY,
    wallOptions,
    friction,
    mouseEnable,
    mouseStiffness,
    mouseAngularStiffness,
    w: Math.round(bounds.w),
    h: Math.round(bounds.h),
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || bounds.w < 40 || bounds.h < 40) return;

    const engine = Engine.create({
      enableSleeping: false,
      gravity: { x: gravX, y: gravY },
    });

    const bounding = { width: bounds.w, height: bounds.h };
    makeWalls(bounding, engine.world, wallOptions);

    let mouseConstraint: Matter.MouseConstraint | null = null;
    let cleanupPointer: (() => void) | null = null;

    const onLeave = () => {
      const mouse = mouseConstraint?.mouse;
      if (mouse) {
        // Release grab when pointer leaves the tray
        (mouse as Matter.Mouse & { mouseup: (e: Event) => void }).mouseup(
          new Event("mouseup"),
        );
      }
      window.__lenis?.start();
    };

    if (mouseEnable) {
      const mouse = Mouse.create(container);
      mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: mouseStiffness,
          // Matter accepts angularStiffness at runtime; types omit it.
          ...( { angularStiffness: mouseAngularStiffness } as object ),
        },
      });
      Composite.add(engine.world, mouseConstraint);

      // Keep page scroll free — Matter's wheel handlers block it.
      const mouseAny = mouseConstraint.mouse as Matter.Mouse & {
        mousewheel: EventListener;
      };
      const el = mouseConstraint.mouse.element as HTMLElement;
      el.removeEventListener("mousewheel", mouseAny.mousewheel);
      el.removeEventListener("DOMMouseScroll", mouseAny.mousewheel);

      const onDown = () => window.__lenis?.stop();
      const onUp = () => window.__lenis?.start();
      container.addEventListener("mousedown", onDown);
      container.addEventListener("mouseup", onUp);
      container.addEventListener("mouseleave", onLeave);
      container.addEventListener("touchstart", onDown, { passive: true });
      container.addEventListener("touchend", onUp);

      cleanupPointer = () => {
        container.removeEventListener("mousedown", onDown);
        container.removeEventListener("mouseup", onUp);
        container.removeEventListener("mouseleave", onLeave);
        container.removeEventListener("touchstart", onDown);
        container.removeEventListener("touchend", onUp);
      };
    }

    const bodyOpts = {
      friction: Math.max(1, Math.min(10, friction)) / 10,
      frictionAir: 0.02,
    };
    const made: Matter.Body[] = [];
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * bounding.width;
      const y = size / 2 + i * (size * 0.15 + 10);
      const body =
        shape === "square"
          ? Bodies.rectangle(x, y, size, size, bodyOpts)
          : Bodies.circle(x, y, size / 2, bodyOpts);
      made.push(body);
    }
    Composite.add(engine.world, made);

    const els = Array.from(
      container.querySelectorAll<HTMLElement>("[data-physics-body]"),
    );

    const update = () => {
      rafRef.current = requestAnimationFrame(update);
      for (let i = 0; i < made.length; i++) {
        const el = els[i];
        if (!el) continue;
        const { position, angle } = made[i];
        el.style.visibility = "visible";
        el.style.left = `${position.x}px`;
        el.style.top = `${position.y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
      }
      Engine.update(engine);
    };
    update();

    return () => {
      cancelAnimationFrame(rafRef.current);
      cleanupPointer?.();
      window.__lenis?.start();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  const imgFor = (i: number) => {
    if (!Array.isArray(images) || images.length === 0) return undefined;
    return images[i % images.length]?.src;
  };

  return (
    <div
      ref={containerRef}
      className={cn("gravity-gallery", className)}
      style={{
        ...style,
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {Array.from({ length: n }).map((_, i) => {
        const src = imgFor(i);
        return (
          <div
            key={i}
            data-physics-body=""
            className="gravity-gallery__body"
            style={{
              position: "absolute",
              visibility: "hidden",
              width: size,
              height: size,
              borderRadius: shape === "circle" ? "50%" : "12px",
              overflow: "hidden",
              background: src ? "transparent" : color,
              backgroundImage: src ? `url(${src})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "grab",
              boxShadow:
                "0 12px 28px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset",
              willChange: "transform, left, top",
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
