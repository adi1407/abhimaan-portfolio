import type { Metadata } from "next";
import { WorkPage } from "@/features/work";

export const metadata: Metadata = {
  title: "Work",
};

export default function WorkRoute() {
  return (
    <main className="flex flex-1 flex-col">
      <WorkPage />
    </main>
  );
}
