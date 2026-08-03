import type { Metadata } from "next";
import { AboutPage } from "@/features/about";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutRoute() {
  return (
    <main className="flex flex-1 flex-col">
      <AboutPage />
    </main>
  );
}
