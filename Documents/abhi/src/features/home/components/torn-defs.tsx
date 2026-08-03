/**
 * Torn-paper silhouettes for the method poster.
 *
 * Each piece is clipped by an irregular polygon in `objectBoundingBox` units,
 * so one path scales to any piece size.
 *
 * Every edge is one of three kinds:
 * - `torn`   — a deep rip; this piece lies *over* its neighbour there.
 * - `deckle` — the poster's outer boundary, so only a faint hand-cut wobble.
 * - `flat`   — the piece lies *under* its neighbour there, so the edge runs to
 *              the box and stays hidden. Pairing every rip with a flat edge is
 *              what keeps seams gapless: a rip can only ever expose more of the
 *              sheet beneath it, never the background.
 *
 * Paths come from a seeded PRNG evaluated at module scope, so the server and
 * the client always render byte-identical markup.
 */

type Side = "top" | "right" | "bottom" | "left";
type EdgeKind = "torn" | "deckle" | "flat";
type Edges = Record<Side, EdgeKind>;

const STEPS = 36;

/** Inset profile per edge kind, in fractions of the piece's own size. */
const PROFILE = {
  torn: { base: 0.006, coarse: 0.03, fine: 0.009, segment: 5 },
  deckle: { base: 0.004, coarse: 0.007, fine: 0.003, segment: 8 },
} as const;

/** mulberry32 — small, fast, and deterministic for a given seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Number(n.toFixed(4));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Inset for each sample along one edge. Long interpolated anchors give the rip
 * its fibre pulls; the per-sample jitter on top keeps it from reading as a
 * smooth wave.
 */
function edgeInsets(kind: EdgeKind, rand: () => number) {
  if (kind === "flat") return new Array<number>(STEPS + 1).fill(0);

  const { base, coarse, fine, segment } = PROFILE[kind];
  const anchors = Array.from(
    { length: Math.ceil(STEPS / segment) + 2 },
    () => rand() * coarse,
  );

  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const at = i / segment;
    const index = Math.floor(at);
    const from = anchors[index];
    const to = anchors[index + 1] ?? from;

    return base + from + (to - from) * smooth(at - index) + rand() * fine;
  });
}

/** Walks the box clockwise from the top-left, pushing samples inwards. */
function buildTornPath(edges: Edges, seed: number) {
  const rand = mulberry32(seed);
  const top = edgeInsets(edges.top, rand);
  const right = edgeInsets(edges.right, rand);
  const bottom = edgeInsets(edges.bottom, rand);
  const left = edgeInsets(edges.left, rand);

  const points: string[] = [];
  const push = (x: number, y: number) => {
    points.push(`${round(x)} ${round(y)}`);
  };

  for (let i = 0; i <= STEPS; i++) push(i / STEPS, top[i]);
  for (let i = 1; i <= STEPS; i++) push(1 - right[i], i / STEPS);
  for (let i = 1; i <= STEPS; i++) push(1 - i / STEPS, 1 - bottom[i]);
  for (let i = 1; i < STEPS; i++) push(left[i], 1 - i / STEPS);

  return `M${points.join("L")}Z`;
}

/**
 * Edge kinds follow the assembled layout and the stacking order in the CSS:
 * column one (01, 04) tears over column two, each piece tears over the one
 * below it, and the signature strip is laid down last over everything.
 */
const SILHOUETTES: readonly { clipId: string; seed: number; edges: Edges }[] = [
  {
    clipId: "torn-01",
    seed: 8_312,
    edges: { top: "deckle", right: "torn", bottom: "torn", left: "deckle" },
  },
  {
    clipId: "torn-02",
    seed: 25_117,
    edges: { top: "deckle", right: "deckle", bottom: "torn", left: "flat" },
  },
  {
    clipId: "torn-03",
    seed: 61_904,
    edges: { top: "flat", right: "deckle", bottom: "torn", left: "flat" },
  },
  {
    clipId: "torn-04",
    seed: 44_286,
    edges: { top: "flat", right: "torn", bottom: "flat", left: "deckle" },
  },
  {
    clipId: "torn-05",
    seed: 17_593,
    edges: { top: "flat", right: "deckle", bottom: "flat", left: "flat" },
  },
  {
    clipId: "torn-seal-a",
    seed: 90_741,
    edges: { top: "torn", right: "torn", bottom: "deckle", left: "deckle" },
  },
  {
    clipId: "torn-seal-b",
    seed: 33_208,
    edges: { top: "torn", right: "deckle", bottom: "deckle", left: "flat" },
  },
] as const;

export const TORN_CLIPS: readonly string[] = SILHOUETTES.map(
  ({ clipId }) => clipId,
);

export const TORN_FIBER_FILTER_ID = "torn-fiber";

/** Rendered once per section; referenced from CSS via `clip-path: url(#id)`. */
export function TornDefs() {
  return (
    <svg className="torn-defs" aria-hidden focusable="false">
      <defs>
        {SILHOUETTES.map(({ clipId, seed, edges }) => (
          <clipPath key={clipId} id={clipId} clipPathUnits="objectBoundingBox">
            <path d={buildTornPath(edges, seed)} />
          </clipPath>
        ))}

        {/* Frays the clipped silhouette into loose fibres. The region is
            generous because displacement pushes pixels outside the box. */}
        <filter
          id={TORN_FIBER_FILTER_ID}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            seed="7"
            result="fibres"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fibres"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
