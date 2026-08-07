import dynamic from "next/dynamic";
import {
  CreatorsStrip,
  FlightProvider,
  HomeHero,
  LetterCraft,
  PaperFlight,
} from "@/features/home";

/*
 * Everything above the fold ships in the first load. The heavy
 * below-fold acts are split into their own chunks — they are still
 * server-rendered, so the markup and the look are unchanged; only the
 * JavaScript needed to drive them arrives later.
 */
const ProcessPoster = dynamic(() =>
  import("@/features/home/components/process-poster").then(
    (m) => m.ProcessPoster,
  ),
);
const FunPlayground = dynamic(() =>
  import("@/features/home/components/fun-playground").then(
    (m) => m.FunPlayground,
  ),
);
const StudioDocument = dynamic(() =>
  import("@/features/home/components/studio-document").then(
    (m) => m.StudioDocument,
  ),
);
const ContactCta = dynamic(() =>
  import("@/features/home/components/contact-cta").then((m) => m.ContactCta),
);

export default function HomePage() {
  return (
    <FlightProvider>
      <main className="home-page flex flex-1 flex-col">
        <HomeHero />
        <LetterCraft />
        <CreatorsStrip />
        <ProcessPoster />
        <FunPlayground />
        {/* Scroll-built poster composite — the last beat before contact. */}
        <StudioDocument />
        <ContactCta />
        {/* Fixed overlay — kept inside main so section lookup always works. */}
        <PaperFlight />
      </main>
    </FlightProvider>
  );
}
