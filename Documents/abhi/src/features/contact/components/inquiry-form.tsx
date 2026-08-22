"use client";

import { useEffect, useState } from "react";
import { FormParticles } from "@/features/contact/components/form-particles";

/* ================================================================== *
 * Inquiry form — a printer's job ticket.
 *
 * Four entries on a ruled docket: who, where to reply, a number, and
 * what the job is. Labels sit small in the left margin, values are set
 * in mono like a filled-out form. The active line gets marching ants;
 * a completed line gets a tick in the margin. Submitting stamps the
 * ticket and files it.
 *
 * Deliberately short: service, budget, deadline and deliverable are
 * conversations for the reply, not barriers to sending.
 * ================================================================== */

export type InquiryStatus = "idle" | "sending" | "ok" | "error";

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", phone: "", message: "" };

const LINES: {
  key: keyof FormState;
  no: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  area?: boolean;
}[] = [
  { key: "name", no: "01", label: "Client", placeholder: "Your name", autoComplete: "name" },
  {
    key: "email",
    no: "02",
    label: "Reply to",
    placeholder: "you@studio.com",
    type: "email",
    autoComplete: "email",
  },
  {
    key: "phone",
    no: "03",
    label: "Mobile",
    placeholder: "+91 …",
    type: "tel",
    autoComplete: "tel",
  },
  { key: "message", no: "04", label: "The job", placeholder: "What are we making?", area: true },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InquiryForm({
  onStatusChange,
  mobile,
}: {
  onStatusChange?: (s: InquiryStatus) => void;
  mobile?: boolean;
} = {}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<InquiryStatus>("idle");
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  /* A line only ticks when its value is actually usable — an email that
     is still being typed should not read as complete. */
  const done = (key: keyof FormState) => {
    const v = form[key].trim();
    if (!v) return false;
    if (key === "email") return EMAIL_RE.test(v);
    return true;
  };

  const filled = LINES.filter((l) => done(l.key)).length;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Could not send. Try again.");
        return;
      }
      setForm(INITIAL);
      setStatus("ok");
    } catch {
      setStatus("error");
      setError("Network error. Try again in a moment.");
    }
  };

  return (
    <div className="ticket-wrap">
      <FormParticles activeField={focusedField} status={status} />
      <form
      /* `is-filed` both runs the stamp animation and holds its landed
         state. Because the class is removed on the next send and added
         again on success, a second enquiry replays it — no timer or
         extra state needed. */
      className={`ticket${status === "ok" ? " is-filed" : ""}${
        mobile ? " ticket--mobile" : ""
      }`}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="ticket__head">
        <span className="ticket__title">Job ticket</span>
        <span className="ticket__no" aria-hidden>
          NO. {String(new Date().getFullYear()).slice(2)}—
          {String(filled).padStart(2, "0")}/04
        </span>
      </div>

      <div className="ticket__body">
        {LINES.map((line) => (
          <label
            key={line.key}
            className={`ticket__line${done(line.key) ? " is-done" : ""}${
              line.area ? " ticket__line--area" : ""
            }`}
          >
            <span className="ticket__margin" aria-hidden>
              <i className="ticket__no-sm">{line.no}</i>
              <i className="ticket__tick">✓</i>
            </span>

            <span className="ticket__label">{line.label}</span>

            <span className="ticket__entry">
              {line.area ? (
                <textarea
                  name={line.key}
                  rows={3}
                  required
                  value={form[line.key]}
                  onChange={set(line.key)}
                  onFocus={() => setFocusedField(line.key)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={line.placeholder}
                />
              ) : (
                <input
                  name={line.key}
                  type={line.type}
                  autoComplete={line.autoComplete}
                  required={line.key !== "phone"}
                  value={form[line.key]}
                  onChange={set(line.key)}
                  onFocus={() => setFocusedField(line.key)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={line.placeholder}
                />
              )}
              <i className="ticket__ants" aria-hidden />
            </span>
          </label>
        ))}
      </div>

      <div className="ticket__foot">
        <button
          type="submit"
          className="ticket__submit"
          disabled={status === "sending"}
        >
          <span>{status === "sending" ? "Sending…" : "Send the ticket"}</span>
        </button>

        <p className="ticket__note" aria-hidden>
          Reply within two working days
        </p>
      </div>

      {/* Rubber stamp — lands once on success. */}
      <span className="ticket__stamp" aria-hidden>
        <span className="ticket__stamp-inner">
          Received
          <em>ABHIMAAN STUDIO</em>
        </span>
      </span>

      <p
        className={`ticket__status${
          status === "error" ? " is-err" : status === "ok" ? " is-ok" : ""
        }`}
        role={status === "error" ? "alert" : "status"}
      >
        {status === "ok"
          ? "Filed — I'll come back to you within two working days."
          : status === "error"
            ? error
            : ""}
      </p>
    </form>
    </div>
  );
}
