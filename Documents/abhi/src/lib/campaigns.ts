export type CampaignId = "abhi1" | "abhi2" | "abhi3";

export type CampaignLayout = "mosaic-6a" | "mosaic-6b" | "mosaic-8";

/** Native frame of the asset — cells must match so posters never crop. */
export type CampaignAspect = "story" | "sheet";

export type CampaignImage = {
  id: string;
  src: string;
  label: string;
  /** story = 9:16 (1080×1920); sheet = 4:5 (1080×1350) */
  aspect?: CampaignAspect;
};

export type Campaign = {
  id: CampaignId;
  title: string;
  subtitle: string;
  cover: string;
  layout: CampaignLayout;
  images: CampaignImage[];
};

/**
 * Campaign poster sets — outside the four Work category filters.
 * Paths point at public/abhi{1,2,3}/*.webp (see scripts/normalize-campaigns.mjs).
 *
 * TODO: replace public/abhi2 assets — currently byte-identical to abhi1.
 * When 7 unique files land, bump layout to "mosaic-7" and re-run normalize.
 */
export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "abhi1",
    title: "GodLike · Match day",
    subtitle: "Esports match-day posters",
    cover: "/abhi1/godlike-mvp.webp",
    layout: "mosaic-6a",
    images: [
      {
        id: "godlike-mvp",
        src: "/abhi1/godlike-mvp.webp",
        label: "GodLike MVP",
      },
      {
        id: "game-day",
        src: "/abhi1/game-day.webp",
        label: "Game Day",
      },
      {
        id: "godlike-finals-zgod",
        src: "/abhi1/godlike-finals-zgod.webp",
        label: "GodLike Finals ZGod",
      },
      {
        id: "godlike-match-story",
        src: "/abhi1/godlike-match-story.webp",
        label: "GodLike Match Story",
      },
      {
        id: "godlike-sd-2",
        src: "/abhi1/godlike-sd-2.webp",
        label: "GodLike SD 2",
      },
      {
        id: "mino-st",
        src: "/abhi1/mino-st.webp",
        label: "Mino ST",
      },
    ],
  },
  {
    id: "abhi2",
    title: "GodLike · Series 02",
    subtitle: "Placeholder set — swap folder when ready",
    cover: "/abhi2/game-day.webp",
    layout: "mosaic-6b",
    images: [
      {
        id: "game-day",
        src: "/abhi2/game-day.webp",
        label: "Game Day",
      },
      {
        id: "godlike-mvp",
        src: "/abhi2/godlike-mvp.webp",
        label: "GodLike MVP",
      },
      {
        id: "godlike-sd-2",
        src: "/abhi2/godlike-sd-2.webp",
        label: "GodLike SD 2",
      },
      {
        id: "godlike-finals-zgod",
        src: "/abhi2/godlike-finals-zgod.webp",
        label: "GodLike Finals ZGod",
      },
      {
        id: "godlike-match-story",
        src: "/abhi2/godlike-match-story.webp",
        label: "GodLike Match Story",
      },
      {
        id: "mino-st",
        src: "/abhi2/mino-st.webp",
        label: "Mino ST",
      },
    ],
  },
  {
    id: "abhi3",
    title: "True Ripper",
    subtitle: "Roster poster sheet",
    cover: "/abhi3/true-ripper-final-group.webp",
    layout: "mosaic-8",
    images: [
      {
        id: "true-ripper-final-group",
        src: "/abhi3/true-ripper-final-group.webp",
        label: "True Ripper Final",
        aspect: "sheet",
      },
      {
        id: "true-ripper-second",
        src: "/abhi3/true-ripper-second.webp",
        label: "True Ripper Second",
        aspect: "sheet",
      },
      {
        id: "true-ripper-first",
        src: "/abhi3/true-ripper-first.webp",
        label: "True Ripper First",
        aspect: "story",
      },
      {
        id: "true-ripper-harsh",
        src: "/abhi3/true-ripper-harsh.webp",
        label: "True Ripper Harsh",
        aspect: "story",
      },
      {
        id: "true-ripper-hydro",
        src: "/abhi3/true-ripper-hydro.webp",
        label: "True Ripper Hydro",
        aspect: "story",
      },
      {
        id: "true-ripper-jelly",
        src: "/abhi3/true-ripper-jelly.webp",
        label: "True Ripper Jelly",
        aspect: "story",
      },
      {
        id: "true-ripper-kiolamo",
        src: "/abhi3/true-ripper-kiolamo.webp",
        label: "True Ripper Kiolamo",
        aspect: "story",
      },
      {
        id: "true-ripper-reel",
        src: "/abhi3/true-ripper-reel.webp",
        label: "True Ripper Reel",
        aspect: "story",
      },
    ],
  },
] as const;

export function getCampaign(id: CampaignId): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
