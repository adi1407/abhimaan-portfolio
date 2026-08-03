import type { Metadata } from "next";
import { ServicesPage } from "@/features/services";

export const metadata: Metadata = {
  title: "Services",
};

export default function ServicesRoute() {
  return (
    <main className="flex flex-1 flex-col">
      <ServicesPage />
    </main>
  );
}
