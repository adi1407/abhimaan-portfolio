"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 1100;
const TRI_COUNT = 48;
const PRIMARY = 0x0b1f4d;

function createDotTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function CreatorsParticles() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const width = () => Math.max(host.clientWidth, 1);
    const height = () => Math.max(host.clientHeight, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width() / height(), 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const spreadX = 18;
    const spreadY = 7;
    const spreadZ = 8;

    const positions = new Float32Array(COUNT * 3);
    const vx = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const amp = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spreadX * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * spreadY * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * spreadZ;
      vx[i] = 0.35 + Math.random() * 0.85;
      if (Math.random() > 0.55) vx[i] *= -1;
      phase[i] = Math.random() * Math.PI * 2;
      amp[i] = 0.15 + Math.random() * 0.55;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const texture = createDotTexture();
    const material = new THREE.PointsMaterial({
      color: PRIMARY,
      size: 0.14,
      map: texture ?? undefined,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([0, 0.22, 0, -0.18, -0.14, 0, 0.18, -0.14, 0]),
        3,
      ),
    );
    const triMat = new THREE.MeshBasicMaterial({
      color: PRIMARY,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const triangles = new THREE.InstancedMesh(triGeo, triMat, TRI_COUNT);
    const dummy = new THREE.Object3D();
    const triX = new Float32Array(TRI_COUNT);
    const triY = new Float32Array(TRI_COUNT);
    const triZ = new Float32Array(TRI_COUNT);
    const triVel = new Float32Array(TRI_COUNT);
    const triPhase = new Float32Array(TRI_COUNT);
    const triScale = new Float32Array(TRI_COUNT);
    const triRot = new Float32Array(TRI_COUNT);

    for (let i = 0; i < TRI_COUNT; i++) {
      triX[i] = (Math.random() - 0.5) * spreadX * 2;
      triY[i] = (Math.random() - 0.5) * spreadY * 2;
      triZ[i] = (Math.random() - 0.5) * spreadZ * 0.6;
      triVel[i] = 0.2 + Math.random() * 0.45;
      if (Math.random() > 0.5) triVel[i] *= -1;
      triPhase[i] = Math.random() * Math.PI * 2;
      triScale[i] = 0.35 + Math.random() * 0.9;
      triRot[i] = Math.random() * Math.PI;
      dummy.position.set(triX[i], triY[i], triZ[i]);
      dummy.rotation.set(0, 0, triRot[i]);
      dummy.scale.setScalar(triScale[i]);
      dummy.updateMatrix();
      triangles.setMatrixAt(i, dummy.matrix);
    }
    triangles.instanceMatrix.needsUpdate = true;
    scene.add(triangles);

    let visible = true;
    let raf = 0;
    let last = performance.now();

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

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) {
        last = now;
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;

      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        arr[i3] += vx[i] * dt;
        arr[i3 + 1] += Math.sin(t * 0.7 + phase[i]) * amp[i] * dt * 0.85;

        if (arr[i3] > spreadX) arr[i3] = -spreadX;
        if (arr[i3] < -spreadX) arr[i3] = spreadX;
        if (arr[i3 + 1] > spreadY) arr[i3 + 1] = -spreadY;
        if (arr[i3 + 1] < -spreadY) arr[i3 + 1] = spreadY;
      }
      pos.needsUpdate = true;

      for (let i = 0; i < TRI_COUNT; i++) {
        triX[i] += triVel[i] * dt;
        if (triX[i] > spreadX) triX[i] = -spreadX;
        if (triX[i] < -spreadX) triX[i] = spreadX;
        triRot[i] += dt * 0.25 * Math.sign(triVel[i] || 1);

        dummy.position.set(
          triX[i],
          triY[i] + Math.sin(t * 0.55 + triPhase[i]) * 0.35,
          triZ[i],
        );
        dummy.rotation.set(0, 0, triRot[i]);
        dummy.scale.setScalar(triScale[i]);
        dummy.updateMatrix();
        triangles.setMatrixAt(i, dummy.matrix);
      }
      triangles.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObs.disconnect();
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      triGeo.dispose();
      triMat.dispose();
      triangles.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={hostRef} className="creators__particles" aria-hidden />;
}
