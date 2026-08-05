import {
  ContactCta,
  CreatorsStrip,
  FlightProvider,
  FunPlayground,
  HomeHero,
  LetterCraft,
  PaperFlight,
  ProcessPoster,
  StudioDocument,
} from "@/features/home";

export default function HomePage() {
  return (
    <FlightProvider>
      <main className="home-page flex flex-1 flex-col">
        <HomeHero />
        <LetterCraft />
        <StudioDocument />
        <CreatorsStrip />
        <ProcessPoster />
        <FunPlayground />
        <ContactCta />
        {/* Fixed overlay — kept inside main so section lookup always works. */}
        <PaperFlight />
      </main>
    </FlightProvider>
  );
}
