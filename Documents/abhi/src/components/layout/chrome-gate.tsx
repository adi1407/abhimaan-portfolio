"use client";

import { usePathname } from "next/navigation";

/** Hide public site chrome on the studio CMS. */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path?.startsWith("/admin")) return null;
  return <>{children}</>;
}
