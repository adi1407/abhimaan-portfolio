"use client";

import { useEffect, useRef } from "react";
import type { InquiryStatus } from "@/features/contact/components/inquiry-form";

/* ================================================================== *
 * Form particles — soft ink motes that drift up from the ticket.
 * Canvas 2D only: no Three.js, light on phones, pauses off-screen.
 * ================================================================== */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  tone: number;
};

const TONES = [
  "rgba(37, 99, 255, 0.55)",
  "rgba(37, 99, 255, 0.32)",
  "rgba(11, 31, 77, 0.28)",
  "rgba(247, 244, 236, 0.42)",
];

function spawn(
  w: number,
  h: number,
  burst = false,
  anchorX?: number,
): Particle {
  const cx = anchorX ?? w * (0.25 + Math.random() * 0.5);
  const spread = burst ? 0.35 : 0.22;
  const x = cx + (Math.random() - 0.5) * w * spread;
  const y = burst ? h * 0.45 + Math.random() * h * 0.15 : h + Math.random() * 24;
  const speed = burst ? 0.55 + Math.random() * 0.9 : 0.18 + Math.random() * 0.42;
  const size = burst ? 2 + Math.random() * 3.5 : 1.2 + Math.random() * 2.8;
  const maxLife = burst ? 1.4 + Math.random() * 0.8 : 2.8 + Math.random() * 2.2;

  return {
    x,
    y,
    vx: (Math.random() - 0.5) * (burst ? 0.55 : 0.22),
    vy: -speed,
    size,
    alpha: burst ? 0.65 + Math.random() * 0.25 : 0.35 + Math.random() * 0.35,
    life: 0,
    maxLife,
    tone: Math.floor(Math.random() * TONES.length),
  };
}

type FormParticlesProps = {
  activeField: string | null;
  status: InquiryStatus;
};

export function FormParticles({ activeField, status }: FormParticlesProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(activeField);
  const statusRef = useRef(status);

  useEffect(() => {
    activeRef.current = activeField;
  }, [activeField]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(max-width: 900px)");
    const isMobile = () => mobileMq.matches;
    const reduced = () => reduceMotion.matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const particles: Particle[] = [];
    let targetCount = isMobile() ? 26 : 48;
    let burstTimer = 0;
    let focusPulse = 0;
    let onScreen = true;
    let raf = 0;
    let last = performance.now();
    let prevStatus: InquiryStatus = "idle";

    const resize = () => {
      const rect = host.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targetCount = isMobile() ? 26 : 48;
    };

    const seed = () => {
      particles.length = 0;
      const n = reduced() ? Math.min(12, targetCount) : targetCount;
      for (let i = 0; i < n; i += 1) {
        const p = spawn(w, h);
        p.life = Math.random() * p.maxLife * 0.6;
        p.y = Math.random() * h;
        particles.push(p);
      }
    };

    resize();
    seed();

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(host);

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!onScreen) {
        last = now;
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;

      if (statusRef.current === "ok" && prevStatus !== "ok") {
        burstTimer = 1.2;
        const burstN = isMobile() ? 14 : 22;
        for (let i = 0; i < burstN; i += 1) {
          particles.push(spawn(w, h, true, w * 0.5));
        }
      }
      prevStatus = statusRef.current;

      if (activeRef.current) {
        focusPulse = 1;
      } else {
        focusPulse = Math.max(0, focusPulse - dt * 1.8);
      }

      if (burstTimer > 0) burstTimer = Math.max(0, burstTimer - dt);

      const spawnRate =
        reduced()
          ? 0.4
          : 2.2 + focusPulse * 4 + burstTimer * 10;

      while (particles.length < targetCount) {
        particles.push(spawn(w, h));
      }

      if (!reduced() && Math.random() < spawnRate * dt) {
        const anchor = activeRef.current ? w * 0.5 : undefined;
        particles.push(spawn(w, h, burstTimer > 0.2, anchor));
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          if (!reduced()) particles.push(spawn(w, h));
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(1, p.life * 3);
        const fadeOut = 1 - lifeRatio * lifeRatio;
        const a = p.alpha * fadeIn * fadeOut;

        p.x += p.vx + Math.sin(t * 1.4 + p.y * 0.02) * 0.12;
        p.y += p.vy * (reduced() ? 0.35 : 1);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = TONES[p.tone].replace(
          /[\d.]+\)$/,
          `${a.toFixed(3)})`,
        );
        ctx.fill();
      }

      /* Soft glow pool under the form when a field is active. */
      if (focusPulse > 0.02 && !reduced()) {
        const g = ctx.createRadialGradient(
          w * 0.5,
          h * 0.72,
          0,
          w * 0.5,
          h * 0.72,
          w * 0.42,
        );
        g.addColorStop(0, `rgba(37, 99, 255, ${(0.08 * focusPulse).toFixed(3)})`);
        g.addColorStop(1, "rgba(37, 99, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} className="form-particles" aria-hidden>
      <canvas ref={canvasRef} className="form-particles__canvas" />
    </div>
  );
}
