"use client";

import { Container } from "@/components/layout/container";
import { FooterWordmark } from "@/components/layout/footer-wordmark";
import { ROUTES } from "@/lib/constants";

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
      { label: "Services", href: "/services" },
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

function MarqueeStrip() {
  return (
    <div className="footer__marquee-group">
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="footer__marquee-item">
          {item}
          <em aria-hidden>✦</em>
        </span>
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__marquee" aria-hidden>
        <div className="footer__marquee-track">
          <MarqueeStrip />
          <MarqueeStrip />
        </div>
      </div>

      <Container>
        <div className="footer__cols">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="footer__col">
              <p className="footer__col-title">{col.title}</p>
              <ul>
                {col.links.map((link) => (
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
          ))}

          <div className="footer__col footer__col--say">
            <p className="footer__col-title">Say hello</p>
            <a href={ROUTES.contact} className="footer__mail">
              Get in touch
            </a>
            <p className="footer__blurb">
              Design that argues a position — built to outlast a trend cycle.
            </p>
          </div>
        </div>
      </Container>

      <FooterWordmark />

      <Container>
        <div className="footer__base">
          <p>© {new Date().getFullYear()} Abhimaan — All rights reserved</p>
          <p className="footer__built">
            Designed &amp; built with <em>intent</em>
          </p>
        </div>
      </Container>
    </footer>
  );
}
