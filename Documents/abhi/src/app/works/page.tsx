import type { Metadata } from "next";
import { WorksPage } from "@/features/works";

export const metadata: Metadata = {
  title: "Experience",
};

export default function WorksRoute() {
  return (
    <main className="flex flex-1 flex-col">
      <WorksPage />
    </main>
  );
}
