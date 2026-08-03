export type ProcessStep = {
  id: string;
  tag: string;
  title: string;
  body: string;
  points: readonly string[];
};

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "01",
    tag: "Listen",
    title: "Discovery",
    body: "Before a single mark is made, I map the terrain — who you are, who you're for, and the gap between the two.",
    points: ["Stakeholder interviews", "Audit & landscape", "Positioning brief"],
  },
  {
    id: "02",
    tag: "Frame",
    title: "Direction",
    body: "Territories, not options. Each route argues a different position so the choice is strategic rather than decorative.",
    points: ["Moodboards & references", "Two to three territories", "Narrative rationale"],
  },
  {
    id: "03",
    tag: "Make",
    title: "Design",
    body: "The chosen route is drawn out properly — type scales, grids, colour, motion. Composition over template, always.",
    points: ["Identity system", "Type & grid", "Motion principles"],
  },
  {
    id: "04",
    tag: "Sharpen",
    title: "Refinement",
    body: "Rounds of critique against the brief. Everything that doesn't earn its place gets cut.",
    points: ["Structured feedback", "Detail passes", "Accessibility checks"],
  },
  {
    id: "05",
    tag: "Hand over",
    title: "Delivery",
    body: "Files, guidelines and the reasoning behind the decisions — so the system keeps working after I step away.",
    points: ["Guidelines & tokens", "Production files", "Handover session"],
  },
] as const;
