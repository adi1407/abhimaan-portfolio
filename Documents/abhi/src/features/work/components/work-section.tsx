"use client";

import { useEffect, useRef } from "react";
import { GalleryWall } from "@/features/work/components/gallery-wall";
import type { WorkCategoryId } from "@/lib/work";

type WorkSectionProps = {
  initialCategory?: WorkCategoryId | null;
  focus?: boolean;
};

/**
 * Gallery wall wrapper (legacy). Selected work now lives on `/work` via WorkPage.
 */
export function WorkSection({
  initialCategory = null,
  focus = false,
}: WorkSectionProps) {
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    const id = window.setTimeout(() => {
      wallRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 60);
    return () => window.clearTimeout(id);
  }, [focus]);

  return (
    <div ref={wallRef}>
      <GalleryWall initialCategory={initialCategory} />
    </div>
  );
}
