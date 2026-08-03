import {
  ContactCta,
  CreatorsStrip,
  FlightProvider,
  FunPlayground,
  HomeHero,
  PaperFlight,
  ProcessPoster,
} from "@/features/home";

export default function HomePage() {
  return (
    <main className="home-page flex flex-1 flex-col">
      <FlightProvider>
        <PaperFlight />
        <HomeHero />
        <CreatorsStrip />
        <ProcessPoster />
        <FunPlayground />
        <ContactCta />
      </FlightProvider>
    </main>
  );
}
