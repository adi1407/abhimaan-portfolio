import type { Metadata } from "next";
import { ContactPage } from "@/features/contact";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactRoute() {
  return (
    <main className="flex flex-1 flex-col">
      <ContactPage />
    </main>
  );
}
