"use client";

import { useState } from "react";
import { INQUIRY_SERVICES, type InquiryService } from "@/lib/inquiries/types";

type FormState = {
  name: string;
  email: string;
  phone: string;
  service: InquiryService | "";
  deliverable: string;
  deadline: string;
  budget: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  service: "",
  deliverable: "",
  deadline: "",
  budget: "",
  message: "",
};

export function InquiryForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

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
    <form className="inquiry-form" onSubmit={onSubmit} noValidate>
      <header className="inquiry-form__head">
        <p className="inquiry-form__eyebrow">Project brief</p>
        <h2 className="inquiry-form__title">Photoshop or post request</h2>
        <p className="inquiry-form__lede">
          Tell me what you need — stills, motion, or both. Submissions land in
          the studio inbox.
        </p>
      </header>

      <div className="inquiry-form__grid">
        <label className="inquiry-form__field">
          <span>Name</span>
          <input
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={set("name")}
            placeholder="Your name"
          />
        </label>

        <label className="inquiry-form__field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="you@studio.com"
          />
        </label>

        <label className="inquiry-form__field">
          <span>Phone <em>(optional)</em></span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+91 …"
          />
        </label>

        <label className="inquiry-form__field">
          <span>Service</span>
          <select
            name="service"
            required
            value={form.service}
            onChange={set("service")}
          >
            <option value="" disabled>
              Select…
            </option>
            {INQUIRY_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="inquiry-form__field">
          <span>Deliverable</span>
          <input
            name="deliverable"
            value={form.deliverable}
            onChange={set("deliverable")}
            placeholder="Thumbnails, jersey edit, reel cover…"
          />
        </label>

        <label className="inquiry-form__field">
          <span>Deadline <em>(optional)</em></span>
          <input
            name="deadline"
            value={form.deadline}
            onChange={set("deadline")}
            placeholder="e.g. 12 Aug"
          />
        </label>

        <label className="inquiry-form__field inquiry-form__field--full">
          <span>Budget <em>(optional)</em></span>
          <input
            name="budget"
            value={form.budget}
            onChange={set("budget")}
            placeholder="Rough range"
          />
        </label>

        <label className="inquiry-form__field inquiry-form__field--full">
          <span>Brief</span>
          <textarea
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={set("message")}
            placeholder="What are we making, and who is it for?"
          />
        </label>
      </div>

      <div className="inquiry-form__foot">
        <button
          type="submit"
          className="inquiry-form__submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send request"}
        </button>

        {status === "ok" ? (
          <p className="inquiry-form__status inquiry-form__status--ok" role="status">
            Sent — I&apos;ll get back within two working days.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="inquiry-form__status inquiry-form__status--err" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
