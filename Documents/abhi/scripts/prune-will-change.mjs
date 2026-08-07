/**
 * `will-change` promotes an element to its own compositor layer and
 * KEEPS it there. That is worth paying for on something that animates
 * continuously; it is pure wasted GPU memory on something that
 * animates once on reveal, or only while hovered.
 *
 * This removes the hint from the idle cases and leaves it on the
 * genuinely continuous ones. Purely a memory change — the browser
 * still promotes these elements while their animation actually runs,
 * so nothing looks different.
 *
 *   node scripts/prune-will-change.mjs --dry
 *   node scripts/prune-will-change.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const DRY = process.argv.includes("--dry");
const FILE = "src/app/globals.css";

/** Animates only on a one-shot reveal, a rare state change, or a
 *  scroll pass — no reason to hold a layer for the whole session. */
const DROP = new Set([
  ".reveal",
  ".split__unit",
  ".role-cycle__char",
  ".piece",
  ".piece__body",
  ".kc__ch",
  ".cube",
  ".uni__piece",
  ".quad",
  ".wh__card",
  ".fun__card",
  ".artboard__layer",
  ".rh__plate",
  ".rh__plate > i",
  ".ip__plate",
  ".pp-shard",
  ".hero__center",
  ".ch__inner",
  ".psh__stage",
  ".wall__grid.is-cast .wall-item",
  ".sdoc__layer",
  ".poster__sheet",
  ".nav-flip__track",
  ".nav-cta__track",
  ".nav-mag",
  ".nav-cta",
  ".contact__mail",
  ".contact-page__mail",
  ".page-transition__wipe",
  ".page-transition__orb",
]);

/** Left alone — these run for as long as the page is open:
 *  .ch__wall .ch__track .creators__track .footer__marquee-track
 *  .paper-flight__body .nav-cursor .lanyard__pivot .lanyard__clip
 *  .film__video--canvas
 */

const src = await readFile(FILE, "utf8");
const lines = src.split("\n");
const out = [];
const stack = [];
const removed = [];

for (let i = 0; i < lines.length; i += 1) {
  const raw = lines[i];
  const line = raw.trim();

  if (line.endsWith("{")) {
    stack.push(line.slice(0, -1).trim());
    out.push(raw);
    continue;
  }
  if (line === "}") {
    stack.pop();
    out.push(raw);
    continue;
  }

  const sel = stack[stack.length - 1];
  if (line.startsWith("will-change") && sel && DROP.has(sel)) {
    removed.push(`${String(i + 1).padStart(6)}  ${sel}  ← ${line}`);
    continue; // drop the declaration
  }
  out.push(raw);
}

console.log(`removed ${removed.length} will-change declarations:`);
for (const r of removed) console.log("  " + r);

if (!DRY) {
  await writeFile(FILE, out.join("\n"));
  console.log("\nwritten.");
} else {
  console.log("\n(dry run — nothing written)");
}
