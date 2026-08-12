import type { Metadata } from "next";
import { fontVariables } from "@/app/fonts";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NavProvider } from "@/components/layout/nav-provider";
import { OffscreenPause } from "@/components/perf/offscreen-pause";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { SITE, SITE_IMAGE } from "@/lib/constants";
import { CmsProvider } from "@/lib/cms/provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003",
  ),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  icons: {
    icon: SITE_IMAGE,
    apple: SITE_IMAGE,
  },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    images: [{ url: SITE_IMAGE, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: [SITE_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SmoothScroll>
          <CmsProvider>
          <NavProvider>
            <SiteHeader />
            <div className="flex min-h-full flex-1 flex-col">{children}</div>
            <SiteFooter />
            <OffscreenPause />
          </NavProvider>
          </CmsProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
