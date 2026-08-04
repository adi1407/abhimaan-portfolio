"use client";

import { useEffect, useRef, useState } from "react";
import { RoleCycle } from "@/components/motion/role-cycle";
import { ContactScene } from "@/features/contact/components/contact-scene";
import {
  InquiryForm,
  type InquiryStatus,
} from "@/features/contact/components/inquiry-form";
import { EMAIL, SITE } from "@/lib/constants";

const VERBS = ["build", "create", "link", "craft", "design"] as const;

const LINES = [
  "Something worth looking at.",
  "Identity, stories & visual systems — composed, never templated.",
] as const;

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<InquiryStatus>("idle");
  const mailRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
    <section className="contact-page" aria-labelledby="contact-page-heading">
      <div className="contact-page__stage">
        <ContactScene focusedField={focusedField} formStatus={formStatus} />
        <p className="contact-page__stage-tag" aria-hidden>
          Untitled-1 · Tools
        </p>
      </div>

      <div className="contact-page__board">
        <div className="contact-page__board-chrome" aria-hidden>
          <span>RGB/8</span>
          <span>05 — Contact</span>
          <span>100%</span>
        </div>

        <p className="contact-page__eyebrow">Brief request</p>

        <h1 id="contact-page-heading" className="contact-page__title">
          <span className="contact-page__static">Let&apos;s</span>
          <span className="sr-only">{VERBS.join(", ")}</span>
          <RoleCycle roles={VERBS} className="contact-page__verb" holdMs={2200} />
          <span className="contact-page__static">together</span>
        </h1>

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
          {SITE.name} replies within two working days — identity, digital and art
          direction.
        </p>

        <InquiryForm
          onFieldFocus={setFocusedField}
          onStatusChange={setFormStatus}
        />
      </div>
    </section>
  );
}
