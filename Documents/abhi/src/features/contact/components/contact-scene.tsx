"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { InquiryStatus } from "@/features/contact/components/inquiry-form";

/* ================================================================== *
 * Contact scene — Floating Tools Hero
 *
 * Cinematic still-life of Photoshop tools. Idle orbit + pointer magnet,
 * assemble-on-enter, focus dolly, and a brief gather on form success.
 * ================================================================== */

const INK = 0x0b1f4d;
const SPARK = 0x2563ff;
const CREAM = 0xf7f4ec;
const METAL = 0xc8d0dc;

export type ContactObjectKey =
  | "layers"
  | "pen"
  | "eyedropper"
  | "crop"
  | "swatch";

const FIELD_TO_OBJECT: Record<string, ContactObjectKey> = {
  name: "layers",
  phone: "layers",
  service: "layers",
  deadline: "layers",
  message: "pen",
  email: "eyedropper",
  deliverable: "crop",
  budget: "swatch",
};

const ALL_KEYS: ContactObjectKey[] = [
  "layers",
  "pen",
  "eyedropper",
  "crop",
  "swatch",
];

type Pose = { x: number; y: number; z: number; scale: number };

const REST: Record<ContactObjectKey, Pose> = {
  layers: { x: -1.35, y: 0.95, z: 0.1, scale: 1.25 },
  pen: { x: 1.45, y: 0.35, z: 0.4, scale: 1.2 },
  eyedropper: { x: -0.55, y: -1.35, z: -0.15, scale: 1.2 },
  crop: { x: 1.05, y: 1.55, z: -0.35, scale: 1.1 },
  swatch: { x: 1.55, y: -1.25, z: 0.2, scale: 1.1 },
};

function explode(p: Pose): Pose {
  return {
    x: p.x * 2.35,
    y: p.y * 2.2,
    z: p.z - 2.4,
    scale: p.scale * 0.55,
  };
}

function edged(geo: THREE.BufferGeometry, color: number, opacity = 0.35) {
  const edges = new THREE.EdgesGeometry(geo);
  return new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  s.closePath();
  return s;
}

function makeLayers() {
  const g = new THREE.Group();
  const tones = [0x0b1f4d, 0x1a3568, 0x3d5f9e, 0x2563ff];
  for (let i = 0; i < 4; i++) {
    const shape = roundedRect(1.2, 0.85, 0.06);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    geo.center();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: tones[i],
        roughness: 0.45,
        metalness: 0.12,
      }),
    );
    mesh.position.set(i * 0.08, -i * 0.11, i * 0.08);
    mesh.rotation.z = i * 0.03;
    g.add(mesh);
    const edge = edged(geo, 0xffffff, 0.18);
    edge.position.copy(mesh.position);
    edge.rotation.copy(mesh.rotation);
    g.add(edge);
  }
  return g;
}

function makePen() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.95, 12),
    new THREE.MeshStandardMaterial({
      color: METAL,
      roughness: 0.28,
      metalness: 0.65,
    }),
  );
  shaft.position.y = 0.15;

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.28, 12),
    new THREE.MeshStandardMaterial({
      color: INK,
      roughness: 0.5,
      metalness: 0.15,
    }),
  );
  grip.position.y = 0.55;

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.38, 10),
    new THREE.MeshStandardMaterial({
      color: SPARK,
      roughness: 0.35,
      metalness: 0.25,
      emissive: SPARK,
      emissiveIntensity: 0.15,
    }),
  );
  tip.position.y = -0.48;

  g.add(shaft, grip, tip);
  g.rotation.z = -0.55;
  return g;
}

function makeEyedropper() {
  const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: 0xa8c4ff,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.85,
  });
  const ink = new THREE.MeshStandardMaterial({
    color: SPARK,
    roughness: 0.3,
    metalness: 0.2,
  });

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), glass);
  bulb.position.y = 0.58;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.7, 18), glass);
  body.position.y = 0.12;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 16), ink);
  tip.position.y = -0.38;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.018, 8, 20),
    new THREE.MeshStandardMaterial({
      color: METAL,
      roughness: 0.3,
      metalness: 0.7,
    }),
  );
  ring.position.y = 0.38;
  ring.rotation.x = Math.PI / 2;

  g.add(bulb, body, tip, ring);
  g.rotation.z = -0.28;
  return g;
}

function makeCrop() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: CREAM,
    roughness: 0.4,
    metalness: 0.15,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: SPARK,
    roughness: 0.35,
    metalness: 0.2,
  });

  function corner(useAccent: boolean) {
    const c = new THREE.Group();
    const m = useAccent ? accent : mat;
    const barA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), m);
    barA.position.x = 0.35;
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.7, 0.07), m);
    barB.position.y = 0.35;
    c.add(barA, barB);
    return c;
  }

  const tl = corner(true);
  tl.position.set(-0.6, 0.6, 0);
  const br = corner(false);
  br.rotation.z = Math.PI;
  br.position.set(0.6, -0.6, 0);
  const tr = corner(false);
  tr.rotation.z = -Math.PI / 2;
  tr.position.set(0.6, 0.6, 0);
  const bl = corner(true);
  bl.rotation.z = Math.PI / 2;
  bl.position.set(-0.6, -0.6, 0);

  g.add(tl, br, tr, bl);
  return g;
}

function makeSwatch() {
  const g = new THREE.Group();
  const colors = [INK, SPARK, CREAM, 0x7dd3fc];
  const offsets = [
    [-0.22, 0.22, 0.08],
    [0.22, 0.22, 0.02],
    [-0.22, -0.22, -0.02],
    [0.22, -0.22, 0.12],
  ] as const;

  offsets.forEach(([x, y, z], i) => {
    const geo = new THREE.BoxGeometry(0.52, 0.52, 0.52);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.35,
        metalness: 0.18,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(0.12 * i, 0.2 * i, 0.08 * i);
    g.add(mesh);
    const edge = edged(geo, 0xffffff, 0.2);
    edge.position.copy(mesh.position);
    edge.rotation.copy(mesh.rotation);
    g.add(edge);
  });

  return g;
}

const BUILDERS: Record<ContactObjectKey, () => THREE.Group> = {
  layers: makeLayers,
  pen: makePen,
  eyedropper: makeEyedropper,
  crop: makeCrop,
  swatch: makeSwatch,
};

function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

type Item = {
  key: ContactObjectKey;
  group: THREE.Group;
  shadow: THREE.Sprite;
  rest: Pose;
  start: Pose;
  phase: number;
  rotSpeed: number;
  boost: number;
  visible: boolean;
};

export function ContactScene({
  focusedField,
  formStatus = "idle",
}: {
  focusedField: string | null;
  formStatus?: InquiryStatus;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef<ContactObjectKey | null>(null);
  const statusRef = useRef<InquiryStatus>("idle");
  const gatherRef = useRef(0);

  useEffect(() => {
    focusedRef.current = focusedField
      ? (FIELD_TO_OBJECT[focusedField] ?? null)
      : null;
  }, [focusedField]);

  useEffect(() => {
    if (formStatus === "ok" && statusRef.current !== "ok") {
      gatherRef.current = 1;
    }
    statusRef.current = formStatus;
  }, [formStatus]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = window.matchMedia("(max-width: 900px)");
    const isMobile = () => mobileMq.matches;
    const reduced = () => reduceMotion.matches;

    const width = () => Math.max(host.clientWidth, 1);
    const height = () => Math.max(host.clientHeight, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width() / height(), 0.1, 40);
    camera.position.set(0, 0.15, isMobile() ? 8.2 : 7.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile(),
      alpha: true,
      powerPreference: "high-performance",
    });
    const dprCap = isMobile() ? 1 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(4, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6aa0ff, 0.4);
    fill.position.set(-5, -1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.25);
    rim.position.set(0, 2, -4);
    scene.add(rim);

    const rig = new THREE.Group();
    scene.add(rig);

    const shadowTex = createShadowTexture();
    const activeKeys: ContactObjectKey[] = isMobile()
      ? ["layers", "pen", "eyedropper"]
      : ALL_KEYS;

    const items: Item[] = activeKeys.map((keyName) => {
      const group = BUILDERS[keyName]();
      const rest = { ...REST[keyName] };
      if (isMobile()) {
        rest.x *= 0.72;
        rest.y *= 0.72;
        rest.scale *= 0.9;
      }
      const start = reduced() ? { ...rest } : explode(rest);
      group.position.set(start.x, start.y, start.z);
      group.scale.setScalar(start.scale);
      rig.add(group);

      const shadow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: shadowTex ?? undefined,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
      );
      shadow.scale.set(1.5, 1.5, 1);
      shadow.position.set(rest.x, rest.y - 0.85, rest.z - 0.5);
      rig.add(shadow);

      return {
        key: keyName,
        group,
        shadow,
        rest,
        start,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.1 + Math.random() * 0.12,
        boost: 0,
        visible: true,
      };
    });

    let onScreen = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "100px", threshold: 0.01 },
    );
    observer.observe(host);

    const onResize = () => {
      const w = width();
      const h = height();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const cap = isMobile() ? 1 : 1.5;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(host);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      if (isMobile()) return;
      const r = host.getBoundingClientRect();
      pointerTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointerTarget.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    host.addEventListener("pointermove", onPointerMove, { passive: true });

    const camTarget = new THREE.Vector3(0, 0.1, 0);
    const camPos = new THREE.Vector3().copy(camera.position);
    const look = new THREE.Vector3(0, 0.1, 0);

    let raf = 0;
    let last = performance.now();
    const born = performance.now();
    const ASSEMBLE_MS = reduced() ? 0 : 1400;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!onScreen) {
        last = now;
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;
      const assemble = reduced()
        ? 1
        : easeOutCubic(Math.min(1, (now - born) / ASSEMBLE_MS));

      if (gatherRef.current > 0) {
        gatherRef.current = Math.max(0, gatherRef.current - dt * 0.85);
      }
      const gather = gatherRef.current;
      const gatherEase = Math.sin(gather * Math.PI);

      pointerCurrent.x +=
        (pointerTarget.x - pointerCurrent.x) * Math.min(dt * 2.2, 1);
      pointerCurrent.y +=
        (pointerTarget.y - pointerCurrent.y) * Math.min(dt * 2.2, 1);

      if (!reduced()) {
        rig.rotation.y = pointerCurrent.x * 0.18 + Math.sin(t * 0.22) * 0.06;
        rig.rotation.x = -pointerCurrent.y * 0.1 + Math.cos(t * 0.18) * 0.04;
      } else {
        rig.rotation.set(0, 0, 0);
      }

      const active = focusedRef.current;
      let focusPos: THREE.Vector3 | null = null;

      for (const item of items) {
        const isActive = active === item.key;
        const targetBoost = isActive ? 1 : 0;
        item.boost += (targetBoost - item.boost) * Math.min(dt * 5.5, 1);

        const sx = item.start.x + (item.rest.x - item.start.x) * assemble;
        const sy = item.start.y + (item.rest.y - item.start.y) * assemble;
        const sz = item.start.z + (item.rest.z - item.start.z) * assemble;
        const ss =
          item.start.scale + (item.rest.scale - item.start.scale) * assemble;

        const bob = reduced() ? 0 : Math.sin(t * 0.7 + item.phase) * 0.1;
        const sway = reduced() ? 0 : Math.cos(t * 0.45 + item.phase) * 0.07;
        const forward = item.boost * 0.7;

        let px = sx + sway * assemble;
        let py = sy + bob * assemble + item.boost * 0.15;
        let pz = sz + forward;

        if (gatherEase > 0.01) {
          px += (0 - px) * gatherEase * 0.85;
          py += (0 - py) * gatherEase * 0.85;
          pz += (0.4 - pz) * gatherEase * 0.85;
        }

        item.group.position.set(px, py, pz);
        item.group.rotation.y = reduced()
          ? item.boost * 0.25
          : t * item.rotSpeed + item.boost * 0.35;
        item.group.rotation.x = reduced()
          ? 0
          : Math.sin(t * 0.35 + item.phase) * 0.1;
        const scaleMul = 1 + item.boost * 0.22 + gatherEase * 0.15;
        item.group.scale.setScalar(ss * scaleMul);

        item.shadow.position.set(px, py - 0.9, pz - 0.55);
        item.shadow.material.opacity = 0.35 + item.boost * 0.2;

        if (isActive) {
          focusPos = new THREE.Vector3(px, py, pz);
        }

        const dim = active && !isActive ? 0.4 : 1;
        item.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat.emissive) {
              mat.emissive.setHex(isActive || gatherEase > 0.2 ? SPARK : 0x000000);
              mat.emissiveIntensity =
                item.boost * 0.55 + gatherEase * 0.4;
            }
            mat.opacity = dim;
            mat.transparent = dim < 1;
          } else if (child instanceof THREE.LineSegments) {
            const mat = child.material as THREE.LineBasicMaterial;
            mat.opacity = 0.22 * dim;
          }
        });
      }

      const baseZ = isMobile() ? 8.2 : 7.4;
      if (focusPos && !reduced()) {
        camTarget.set(focusPos.x * 0.35, focusPos.y * 0.3, baseZ - 1.1);
        look.set(focusPos.x * 0.45, focusPos.y * 0.4, 0);
      } else {
        camTarget.set(0, 0.15, baseZ);
        look.set(0, 0.1, 0);
      }

      camPos.lerp(camTarget, Math.min(dt * 2.8, 1));
      camera.position.copy(camPos);
      camera.lookAt(look);

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObs.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      shadowTex?.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        } else if (obj instanceof THREE.Sprite) {
          const mat = obj.material;
          mat.map?.dispose();
          mat.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className="contact-scene" aria-hidden />;
}
