"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ================================================================== *
 * Contact scene — a small still-life of Photoshop tools, rendered in
 * real 3D (raw Three.js, matching the CreatorsParticles pattern used
 * on the home page). Five recognisable objects — layers stack, pen
 * nib, eyedropper, crop corners, colour swatch — idle in space, drift
 * toward the cursor, and step forward when their matching form field
 * is focused.
 * ================================================================== */

const INK = 0x0b1f4d;
const SPARK = 0x2563ff;
const CREAM = 0xf7f4ec;

export type ContactObjectKey = "layers" | "pen" | "eyedropper" | "crop" | "swatch";

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
  const tones = [0x0b1f4d, 0x1a3568, 0x3d5f9e];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.BoxGeometry(1.15, 0.8, 0.05);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: tones[i], roughness: 0.55, metalness: 0.08 }),
    );
    mesh.position.set(i * 0.1, -i * 0.12, i * 0.09);
    mesh.rotation.z = i * 0.035;
    g.add(mesh);
    g.add(edged(geo, 0xffffff, 0.22));
    g.children[g.children.length - 1].position.copy(mesh.position);
    g.children[g.children.length - 1].rotation.copy(mesh.rotation);
  }
  return g;
}

function makePen() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.58);
  s.lineTo(0.15, 0.06);
  s.lineTo(0, -0.58);
  s.lineTo(-0.15, 0.06);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  geo.center();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: INK, roughness: 0.4, metalness: 0.15 }),
  );
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

function makeEyedropper() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: SPARK, roughness: 0.35, metalness: 0.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), mat);
  bulb.position.y = 0.5;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.6, 16), mat);
  body.position.y = 0.12;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.26, 16),
    new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5, metalness: 0.1 }),
  );
  tip.position.y = -0.32;
  g.add(bulb, body, tip);
  g.rotation.z = -0.22;
  return g;
}

function makeCrop() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5, metalness: 0.1 });

  function corner() {
    const c = new THREE.Group();
    const barA = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.06), mat);
    barA.position.x = 0.31;
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), mat);
    barB.position.y = 0.31;
    c.add(barA, barB);
    return c;
  }

  const tl = corner();
  tl.position.set(-0.55, 0.55, 0);
  const br = corner();
  br.rotation.z = Math.PI;
  br.position.set(0.55, -0.55, 0);

  g.add(tl, br);
  return g;
}

function makeSwatch() {
  const g = new THREE.Group();
  const backGeo = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.62, 0.08), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  backGeo.center();
  const back = new THREE.Mesh(
    backGeo,
    new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5, metalness: 0.1 }),
  );
  back.position.set(-0.12, -0.12, -0.03);

  const frontGeo = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.62, 0.08), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  frontGeo.center();
  const front = new THREE.Mesh(
    frontGeo,
    new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.3, metalness: 0.05 }),
  );
  front.position.set(0.12, 0.12, 0.03);

  g.add(back, front);
  g.add(edged(frontGeo, 0x0b1f4d, 0.3));
  g.children[g.children.length - 1].position.copy(front.position);
  return g;
}

const BUILDERS: Record<ContactObjectKey, () => THREE.Group> = {
  layers: makeLayers,
  pen: makePen,
  eyedropper: makeEyedropper,
  crop: makeCrop,
  swatch: makeSwatch,
};

const LAYOUT: Record<ContactObjectKey, { x: number; y: number; z: number; scale: number }> = {
  layers: { x: 4.9, y: 1.5, z: 0, scale: 1.15 },
  pen: { x: 5.6, y: -0.3, z: 0.35, scale: 1.1 },
  eyedropper: { x: 3.9, y: -1.85, z: -0.25, scale: 1.1 },
  crop: { x: 4.05, y: 1.95, z: -0.3, scale: 1.05 },
  swatch: { x: 5.7, y: -1.55, z: 0.2, scale: 1 },
};

function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(11,31,77,0.45)");
  g.addColorStop(1, "rgba(11,31,77,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function ContactScene({ focusedField }: { focusedField: string | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef<ContactObjectKey | null>(null);

  useEffect(() => {
    focusedRef.current = focusedField ? (FIELD_TO_OBJECT[focusedField] ?? null) : null;
  }, [focusedField]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const width = () => Math.max(host.clientWidth, 1);
    const height = () => Math.max(host.clientHeight, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width() / height(), 0.1, 30);
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fc4ff, 0.35);
    fill.position.set(-4, -2, 3);
    scene.add(fill);

    const rig = new THREE.Group();
    scene.add(rig);

    const shadowTex = createShadowTexture();
    const items = (Object.keys(BUILDERS) as ContactObjectKey[]).map((key2) => {
      const group = BUILDERS[key2]();
      const layout = LAYOUT[key2];
      group.position.set(layout.x, layout.y, layout.z);
      group.scale.setScalar(layout.scale);
      rig.add(group);

      const shadow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: shadowTex ?? undefined, transparent: true, opacity: 0.5, depthWrite: false }),
      );
      shadow.scale.set(1.3, 1.3, 1);
      shadow.position.set(layout.x, layout.y - 0.05, layout.z - 0.6);
      rig.add(shadow);

      return {
        key: key2,
        group,
        base: { ...layout },
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.12 + Math.random() * 0.1,
        current: 0,
      };
    });

    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "80px", threshold: 0.01 },
    );
    observer.observe(host);

    const onResize = () => {
      const w = width();
      const h = height();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(host);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointerTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointerTarget.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * Math.min(dt * 2.4, 1);
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * Math.min(dt * 2.4, 1);
      rig.rotation.y = pointerCurrent.x * 0.12;
      rig.rotation.x = -pointerCurrent.y * 0.08;

      const active = focusedRef.current;
      for (const item of items) {
        const isActive = active === item.key;
        const targetBoost = isActive ? 1 : 0;
        item.current += (targetBoost - item.current) * Math.min(dt * 5, 1);

        const bob = Math.sin(t * 0.6 + item.phase) * 0.08;
        const sway = Math.cos(t * 0.4 + item.phase) * 0.05;
        const forward = item.current * 0.55;

        item.group.position.set(
          item.base.x + sway,
          item.base.y + bob + item.current * 0.12,
          item.base.z + forward,
        );
        item.group.rotation.y = t * item.rotSpeed + item.current * 0.3;
        item.group.rotation.x = Math.sin(t * 0.3 + item.phase) * 0.08;
        const s = item.base.scale * (1 + item.current * 0.18);
        item.group.scale.setScalar(s);

        const dim = active && !isActive ? 0.55 : 1;
        item.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat.emissive) {
              mat.emissive.setHex(isActive ? SPARK : 0x000000);
              mat.emissiveIntensity = item.current * 0.45;
            }
            mat.opacity = dim;
            mat.transparent = dim < 1;
          } else if (child instanceof THREE.LineSegments) {
            const mat = child.material as THREE.LineBasicMaterial;
            mat.opacity = 0.25 * dim;
          }
        });
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObs.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      shadowTex?.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
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
