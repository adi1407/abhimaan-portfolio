"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  CREATORS,
  creatorInitials,
  creatorPhotoCandidates,
  type Creator,
} from "@/lib/creators";
/* three.js is ~600KB and this canvas is purely decorative, so it is
   split out of the initial bundle and loaded once the strip mounts. */
const CreatorsParticles = dynamic(
  () =>
    import("@/features/home/components/creators-particles").then(
      (m) => m.CreatorsParticles,
    ),
  { ssr: false },
);

/** Repeat the set so each track half is always wider than the viewport. */
const LOOP_SET = [...CREATORS, ...CREATORS, ...CREATORS];

function CreatorAvatar({ creator }: { creator: Creator }) {
  const candidates = creatorPhotoCandidates(creator.slug);
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

function CreatorCard({ creator }: { creator: Creator }) {
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
}: {
  ariaHidden?: boolean;
  keyPrefix: string;
}) {
  return (
    <div className="creators__group" aria-hidden={ariaHidden || undefined}>
      {LOOP_SET.map((creator, i) => (
        <CreatorCard key={`${keyPrefix}-${creator.slug}-${i}`} creator={creator} />
      ))}
    </div>
  );
}

export function CreatorsStrip() {
  return (
    <section className="creators" aria-label="Creators I've worked with">
      <CreatorsParticles />

      <div className="creators__head">
        <p className="creators__eyebrow">Collaborations</p>
        <h2 className="creators__title">Creators I&apos;ve worked with</h2>
      </div>

      <div className="creators__viewport">
        <div className="creators__track">
          <CreatorsGroup keyPrefix="a" />
          <CreatorsGroup keyPrefix="b" ariaHidden />
        </div>
      </div>
    </section>
  );
}
