export type WorkExperience = {
  id: string;
  /** Big display year for the sticky timeline (start of the range). */
  year: string;
  role: string;
  company: string;
  location: string;
  dates: string;
  summary: string;
  highlights: readonly string[];
  tags: readonly string[];
};

/** Placeholder studio roles — swap for real experience anytime. */
export const WORK_EXPERIENCES: readonly WorkExperience[] = [
  {
    id: "01",
    year: "2025",
    role: "Art Designer",
    company: "Studio Northline",
    location: "Remote",
    dates: "2025 — Present",
    summary:
      "Leading identity systems and campaign art for brands that refuse a template. Day-to-day: type, colour, and the argument behind every mark.",
    highlights: [
      "Rebuilt the house visual language across print and digital",
      "Directed two flagship campaigns end to end",
      "Set the type and colour system the team designs within",
    ],
    tags: ["Identity", "Art direction", "Campaign"],
  },
  {
    id: "02",
    year: "2023",
    role: "Graphic Designer",
    company: "Meridian Collective",
    location: "Mumbai, IN",
    dates: "2023 — 2025",
    summary:
      "Built editorial and digital surfaces where scroll is composition. Packaged quiet typography with systems that scale without going soft.",
    highlights: [
      "Shipped a modular editorial system used across 40+ pages",
      "Designed digital surfaces with motion baked into the grid",
      "Owned the handoff pipeline from design to build",
    ],
    tags: ["Editorial", "Digital", "Systems"],
  },
  {
    id: "03",
    year: "2021",
    role: "Visual Designer",
    company: "Atlas Atelier",
    location: "Bengaluru, IN",
    dates: "2021 — 2023",
    summary:
      "Shaped packaging, print, and brand languages for product lines that had to hold a shelf and a story at once.",
    highlights: [
      "Designed packaging for three retail product lines",
      "Developed brand languages that survived real shelves",
      "Ran print production from proof to press",
    ],
    tags: ["Packaging", "Print", "Brand"],
  },
  {
    id: "04",
    year: "2019",
    role: "Junior Designer",
    company: "Quiet Hours Press",
    location: "Pune, IN",
    dates: "2019 — 2021",
    summary:
      "Cut my teeth on layout, production, and the discipline of margins wide enough to breathe. Learned to argue with ink before pixels.",
    highlights: [
      "Laid out long-form editorial on a weekly cadence",
      "Owned production files and press-ready exports",
      "Learned typographic discipline the slow way",
    ],
    tags: ["Layout", "Production", "Type"],
  },
  {
    id: "05",
    year: "2018",
    role: "Design Intern",
    company: "Signal Studio",
    location: "Pune, IN",
    dates: "2018 — 2019",
    summary:
      "Assisted art direction and motion principles for a product that speaks in pulses — my first lesson in restraint under a real deadline.",
    highlights: [
      "Supported art direction on live client work",
      "Prototyped motion principles for a product UI",
      "Ran research and reference decks for pitches",
    ],
    tags: ["Motion", "Assist", "Research"],
  },
] as const;
