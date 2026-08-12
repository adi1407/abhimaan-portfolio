import type { Metadata } from "next";
import { AdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRoute() {
  return (
    <main className="admin-root">
      <AdminPage />
    </main>
  );
}
