"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { WorkFilm } from "@/features/work/components/work-film";
import { CampaignBoards } from "@/features/work/components/campaign-boards";
import { GalleryWall } from "@/features/work/components/gallery-wall";
import { BehanceBridge } from "@/features/work/components/behance-bridge";
import type { WorkCategoryId } from "@/lib/work";

type WorkPageProps = {
  initialCategory?: WorkCategoryId | null;
};

/**
 * Dedicated /work page: film (or short splash on deep-link) → panels → gallery.
 */
export function WorkPage({ initialCategory = null }: WorkPageProps) {
  const [category, setCategory] = useState<WorkCategoryId | null>(
    initialCategory,
  );
  const galleryRef = useRef<HTMLDivElement>(null);

  const scrollToGallery = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      galleryRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  const onSelectCategory = useCallback(
    (id: WorkCategoryId) => {
      setCategory(id);
      scrollToGallery();
    },
    [scrollToGallery],
  );

  useEffect(() => {
    if (!initialCategory) return;
    const id = window.setTimeout(() => {
      setCategory(initialCategory);
      scrollToGallery();
    }, 280);
    return () => window.clearTimeout(id);
  }, [initialCategory, scrollToGallery]);

  return (
    <div className="work-page">
      <WorkFilm
        onSelectCategory={onSelectCategory}
        intro={initialCategory ? "splash" : "full"}
      />
      <CampaignBoards />
      <div
        ref={galleryRef}
        id="work-gallery"
        className="work-gallery"
        style={
          category
            ? ({
                viewTransitionName: `work-panel-${category}`,
              } as CSSProperties)
            : undefined
        }
      >
        <GalleryWall
          initialCategory={category}
          autoOpenBook={category === "books"}
        />
      </div>
      <BehanceBridge />
    </div>
  );
}
