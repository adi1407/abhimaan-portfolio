"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  CREATORS,
  creatorInitials,
  creatorPhotoCandidates,
  type Creator,
} from "@/lib/creators";
import { useHome } from "@/lib/cms/hooks";

type CreatorCardData = Creator & { src?: string };
/* three.js is ~600KB and this canvas is purely decorative, so it is
   split out of the initial bundle and loaded once the strip mounts. */
const CreatorsParticles = dynamic(
  () =>
    import("@/features/home/components/creators-particles").then(
      (m) => m.CreatorsParticles,
    ),
  { ssr: false },
);

function CreatorAvatar({ creator }: { creator: CreatorCardData }) {
  const candidates = creator.src
    ? [creator.src, ...creatorPhotoCandidates(creator.slug)]
    : [...creatorPhotoCandidates(creator.slug)];
  const [srcIndex, setSrcIndex] = useState(0);
  const src = candidates[srcIndex];
  const showPhoto = srcIndex < candidates.length;

  return (
    <span className="creators__avatar">
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="creators__photo"
          draggable={false}
          /* Rendered at ~90px; the source is 800px square, so these are
             the heaviest over-serve on the page. Defer and decode off
             the main thread — the marquee is well below the fold. */
          loading="lazy"
          decoding="async"
          width={200}
          height={200}
          onError={() => setSrcIndex((i) => i + 1)}
        />
      ) : (
        <span className="creators__mono" aria-hidden>
          {creatorInitials(creator.name)}
        </span>
      )}
    </span>
  );
}

function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const inner = (
    <>
      <CreatorAvatar creator={creator} />
      <span className="creators__name">{creator.name}</span>
    </>
  );

  if (creator.href) {
    return (
      <a
        href={creator.href}
        className="creators__card"
        target="_blank"
        rel="noreferrer noopener"
      >
        {inner}
      </a>
    );
  }

  return <div className="creators__card">{inner}</div>;
}

function CreatorsGroup({
  ariaHidden,
  keyPrefix,
  creators,
}: {
  ariaHidden?: boolean;
  keyPrefix: string;
  creators: CreatorCardData[];
}) {
  const loop = [...creators, ...creators, ...creators];
  return (
    <div className="creators__group" aria-hidden={ariaHidden || undefined}>
      {loop.map((creator, i) => (
        <CreatorCard key={`${keyPrefix}-${creator.slug}-${i}`} creator={creator} />
      ))}
    </div>
  );
}

export function CreatorsStrip() {
  const home = useHome<{
    creators?: { eyebrow?: string; title?: string; items?: CreatorCardData[] };
  }>();
  const creators: CreatorCardData[] = home.creators?.items?.length
    ? home.creators.items
    : [...CREATORS];
  return (
    <section className="creators" aria-label="Creators I've worked with">
      <CreatorsParticles />

      <div className="creators__head">
        <p className="creators__eyebrow">
          {home.creators?.eyebrow || "Collaborations"}
        </p>
        <h2 className="creators__title">
          {home.creators?.title || "Creators I've worked with"}
        </h2>
      </div>

      <div className="creators__viewport">
        <div className="creators__track">
          <CreatorsGroup keyPrefix="a" creators={creators} />
          <CreatorsGroup keyPrefix="b" ariaHidden creators={creators} />
        </div>
      </div>
    </section>
  );
}
