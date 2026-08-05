import {
  ContactCta,
  CreatorsStrip,
  FunPlayground,
  HomeHero,
  ProcessPoster,
  StudioDocument,
} from "@/features/home";

export default function HomePage() {
  return (
    <main className="home-page flex flex-1 flex-col">
      <HomeHero />
      <StudioDocument />
      <CreatorsStrip />
      <ProcessPoster />
      <FunPlayground />
      <ContactCta />
    </main>
  );
}
