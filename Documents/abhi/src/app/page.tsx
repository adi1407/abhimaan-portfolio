import {
  ContactCta,
  CreatorsStrip,
  FunPlayground,
  HomeHero,
  ProcessPoster,
} from "@/features/home";

export default function HomePage() {
  return (
    <main className="home-page flex flex-1 flex-col">
      <HomeHero />
      <CreatorsStrip />
      <ProcessPoster />
      <FunPlayground />
      <ContactCta />
    </main>
  );
}
