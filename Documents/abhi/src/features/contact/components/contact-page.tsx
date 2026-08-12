"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { RoleCycle } from "@/components/motion/role-cycle";
import {
  InquiryForm,
  type InquiryStatus,
} from "@/features/contact/components/inquiry-form";
import { EMAIL, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

/* Same reason as the creators canvas: three.js stays out of the route's
   first load and arrives after the form is interactive. */
const ContactScene = dynamic(
  () =>
    import("@/features/contact/components/contact-scene").then(
      (m) => m.ContactScene,
    ),
  { ssr: false },
);

const VERBS = ["build", "create", "link", "craft", "design"] as const;

const LINES = [
  "Something worth looking at.",
  "Identity, stories & visual systems — composed, never templated.",
] as const;

const MOBILE_MQ = "(max-width: 900px)";

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<InquiryStatus>("idle");
  /** null until client media sync — avoids mounting Three.js on phones. */
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const mailRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const mobile = isMobile === true;
  const desktop = isMobile === false;

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!desktop) return;
    const el = mailRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.08}px, ${y * 0.18}px)`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className={cn("contact-page", mobile && "contact-page--mobile")}
      aria-labelledby="contact-page-heading"
    >
      {desktop ? (
        <div className="contact-page__stage">
          <ContactScene focusedField={focusedField} formStatus={formStatus} />
          <p className="contact-page__stage-tag" aria-hidden>
            Untitled-1 · Tools
          </p>
        </div>
      ) : null}

      <div className="contact-page__board">
        {desktop ? (
          <div className="contact-page__board-chrome" aria-hidden>
            <span>RGB/8</span>
            <span>05 — Contact</span>
            <span>100%</span>
          </div>
        ) : null}

        <p className="contact-page__eyebrow">Brief request</p>

        <h1 id="contact-page-heading" className="contact-page__title">
          {mobile ? (
            <>
              <span className="contact-page__static">Let&apos;s work</span>
              <span className="contact-page__static">together</span>
            </>
          ) : (
            <>
              <span className="contact-page__static">Let&apos;s</span>
              <span className="sr-only">{VERBS.join(", ")}</span>
              <RoleCycle
                roles={VERBS}
                className="contact-page__verb"
                holdMs={2200}
              />
              <span className="contact-page__static">together</span>
            </>
          )}
        </h1>

        {mobile ? (
          <p className="contact-page__line contact-page__line--accent">
            Identity, stories &amp; visual systems — send a brief.
          </p>
        ) : (
          <div className="contact-page__lines">
            {LINES.map((line, i) => (
              <p
                key={line}
                className={
                  i === 0
                    ? "contact-page__line contact-page__line--accent"
                    : "contact-page__line"
                }
              >
                {line}
              </p>
            ))}
          </div>
        )}

        <a
          ref={mailRef}
          href={`mailto:${EMAIL}`}
          className="contact-page__mail"
          onMouseMove={onMove}
          onMouseLeave={() => {
            if (mailRef.current) mailRef.current.style.transform = "";
          }}
        >
          <span className="contact-page__mail-text">{EMAIL}</span>
          <span className="contact-page__mail-arrow" aria-hidden>
            ↗
          </span>
        </a>

        <div className="contact-page__actions">
          <button type="button" className="contact-page__copy" onClick={copy}>
            {copied ? "Copied ✓" : "Copy email"}
          </button>
        </div>

        <p className="contact-page__note">
          {SITE.name} replies within two working days — identity, digital and
          art direction.
        </p>

        <InquiryForm
          mobile={mobile}
          onFieldFocus={mobile ? undefined : setFocusedField}
          onStatusChange={setFormStatus}
        />
      </div>
    </section>
  );
}
