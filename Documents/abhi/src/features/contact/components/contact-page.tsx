"use client";

import { useEffect, useRef, useState } from "react";
import { RoleCycle } from "@/components/motion/role-cycle";
import {
  InquiryForm,
  type InquiryStatus,
} from "@/features/contact/components/inquiry-form";
import { EMAIL, SITE } from "@/lib/constants";
import { useContactCopy, useSettings } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

const VERBS = ["build", "create", "link", "craft", "design"] as const;

const LINES = [
  "Something worth looking at.",
  "Identity, stories & visual systems — composed, never templated.",
] as const;

const MOBILE_MQ = "(max-width: 900px)";

export function ContactPage() {
  const settings = useSettings<{ email?: string; name?: string }>();
  const copy = useContactCopy<{
    eyebrow?: string;
    verbs?: string[];
    lines?: string[];
    sla?: string;
  }>();
  const email = settings.email || EMAIL;
  const verbs = copy.verbs?.length ? copy.verbs : [...VERBS];
  const lines = copy.lines?.length ? copy.lines : [...LINES];
  const [copied, setCopied] = useState(false);
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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
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
      <div className="contact-page__shell">
        <div className="contact-page__board">
          <p className="contact-page__eyebrow">{copy.eyebrow || "Brief request"}</p>

          <h1 id="contact-page-heading" className="contact-page__title">
            {mobile ? (
              <>
                <span className="contact-page__static">Let&apos;s work</span>
                <span className="contact-page__static">together</span>
              </>
            ) : (
              <>
                <span className="contact-page__static">Let&apos;s</span>
                <span className="sr-only">{verbs.join(", ")}</span>
                <RoleCycle
                  roles={verbs}
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
              {lines.map((line, i) => (
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
            href={`mailto:${email}`}
            className="contact-page__mail"
            onMouseMove={onMove}
            onMouseLeave={() => {
              if (mailRef.current) mailRef.current.style.transform = "";
            }}
          >
            <span className="contact-page__mail-text">{email}</span>
            <span className="contact-page__mail-arrow" aria-hidden>
              ↗
            </span>
          </a>

          <div className="contact-page__actions">
            <button type="button" className="contact-page__copy" onClick={copyEmail}>
              {copied ? "Copied ✓" : "Copy email"}
            </button>
          </div>

          <p className="contact-page__note">
            {copy.sla ||
              `${settings.name || SITE.name} replies within two working days — identity, digital and art direction.`}
          </p>

          <InquiryForm mobile={mobile} />
        </div>
      </div>
    </section>
  );
}
