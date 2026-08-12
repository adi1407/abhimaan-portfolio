"use client";

import { Container } from "@/components/layout/container";
import { FooterWordmark } from "@/components/layout/footer-wordmark";
import { ROUTES } from "@/lib/constants";
import { useFooterCopy, useSettings } from "@/lib/cms/hooks";

const MARQUEE_ITEMS = [
  "Available for commissions",
  "Identity",
  "Digital",
  "Art direction",
  "Editorial",
  "Branding",
  "Visual systems",
] as const;

const COLUMNS = [
  {
    title: "Navigate",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Work", href: "/work" },
      { label: "Experience", href: "/works" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Instagram", href: "https://instagram.com" },
      { label: "Behance", href: "https://www.behance.net/abhishahi2" },
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "Dribbble", href: "https://dribbble.com" },
    ],
  },
];

function MarqueeStrip({ items }: { items: string[] }) {
  return (
    <div className="footer__marquee-group">
      {items.map((item) => (
        <span key={item} className="footer__marquee-item">
          {item}
          <em aria-hidden>✦</em>
        </span>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const footer = useFooterCopy<{
    marquee?: string[];
    blurb?: string;
    copyright?: string;
  }>();
  const settings = useSettings<{
    name?: string;
    socials?: { label: string; href: string }[];
  }>();
  const marquee = footer.marquee?.length ? footer.marquee : [...MARQUEE_ITEMS];
  const socials = settings.socials?.length
    ? settings.socials
    : COLUMNS[1].links;
  return (
    <footer className="footer">
      <div className="footer__marquee" aria-hidden>
        <div className="footer__marquee-track">
          <MarqueeStrip items={marquee} />
          <MarqueeStrip items={marquee} />
        </div>
      </div>

      <Container>
        <div className="footer__cols">
          {COLUMNS.map((col) => {
            const links = col.title === "Elsewhere" ? socials : col.links;
            return (
            <nav key={col.title} aria-label={col.title} className="footer__col">
              <p className="footer__col-title">{col.title}</p>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="footer__link"
                      {...(link.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      <span>{link.label}</span>
                      <span aria-hidden>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            );
          })}

          <div className="footer__col footer__col--say">
            <p className="footer__col-title">Say hello</p>
            <a href={ROUTES.contact} className="footer__mail">
              Get in touch
            </a>
            <p className="footer__blurb">
              {footer.blurb ||
                "Design that argues a position — built to outlast a trend cycle."}
            </p>
          </div>
        </div>
      </Container>

      <FooterWordmark />

      <Container>
        <div className="footer__base">
          <p>
            © {new Date().getFullYear()}{" "}
            {footer.copyright ||
              `${settings.name || "Abhimaan"} — All rights reserved`}
          </p>
          <p className="footer__built">
            Designed &amp; built with <em>intent</em>
          </p>
        </div>
      </Container>
    </footer>
  );
}
