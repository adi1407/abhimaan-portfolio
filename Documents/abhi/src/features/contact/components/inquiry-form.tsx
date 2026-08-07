"use client";

import { useEffect, useRef, useState } from "react";
import { INQUIRY_SERVICES, type InquiryService } from "@/lib/inquiries/types";
import { LayersPanel, type LayerIconType, type LayerItem } from "@/features/contact/components/layers-panel";

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

const FIELD_META: { key: keyof FormState; label: string; icon: LayerIconType }[] = [
  { key: "name", label: "Name", icon: "person" },
  { key: "email", label: "Email", icon: "at" },
  { key: "phone", label: "Phone", icon: "phone" },
  { key: "service", label: "Service", icon: "briefcase" },
  { key: "deliverable", label: "Deliverable", icon: "image" },
  { key: "deadline", label: "Deadline", icon: "clock" },
  { key: "budget", label: "Budget", icon: "tag" },
  { key: "message", label: "Brief", icon: "lines" },
];

const FLATTEN_MS = 460;

export type InquiryStatus = "idle" | "sending" | "ok" | "error";

export function InquiryForm({
  onFieldFocus,
  onStatusChange,
}: {
  onFieldFocus?: (key: string | null) => void;
  onStatusChange?: (status: InquiryStatus) => void;
} = {}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<InquiryStatus>("idle");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<keyof FormState | null>(null);
  const [flattening, setFlattening] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (prevStatus.current !== "ok" && status === "ok") {
      setFlattening(true);
      const id = window.setTimeout(() => setFlattening(false), FLATTEN_MS);
      return () => window.clearTimeout(id);
    }
    prevStatus.current = status;
  }, [status]);

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const focusHandlers = (key: keyof FormState) => ({
    onFocus: () => {
      setFocused(key);
      onFieldFocus?.(key);
    },
    onBlur: () => {
      setFocused((f) => (f === key ? null : f));
      onFieldFocus?.(null);
    },
  });

  const layers: LayerItem[] = FIELD_META.map((f) => ({
    key: f.key,
    label: f.label,
    icon: f.icon,
    value: form[f.key],
    filled: form[f.key].trim().length > 0,
    active: focused === f.key,
  }));

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

  const onSubmitPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--fx",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    e.currentTarget.style.setProperty(
      "--fy",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  };

  return (
    <form className="inquiry-form" onSubmit={onSubmit} noValidate>
      <div className="inquiry-form__stage">
        <LayersPanel layers={layers} flattening={flattening} />

        <div className="inquiry-form__body">
          <header className="inquiry-form__head">
            <p className="inquiry-form__eyebrow">New layer · Project brief</p>
            <h2 className="inquiry-form__title">Export a request</h2>
            <p className="inquiry-form__lede">
              Fill the stack — stills, motion, or both. Flatten sends it to the
              studio inbox.
            </p>
          </header>

          <div className="inquiry-form__grid">
            <label className="inquiry-form__field">
              <span>Name</span>
              <div className="inquiry-form__control">
                <input
                  name="name"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name"
                  {...focusHandlers("name")}
                />
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Email</span>
              <div className="inquiry-form__control">
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@studio.com"
                  {...focusHandlers("email")}
                />
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Phone <em>(optional)</em></span>
              <div className="inquiry-form__control">
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+91 …"
                  {...focusHandlers("phone")}
                />
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Service</span>
              <div className="inquiry-form__control">
                <select
                  name="service"
                  required
                  value={form.service}
                  onChange={set("service")}
                  {...focusHandlers("service")}
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
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Deliverable</span>
              <div className="inquiry-form__control">
                <input
                  name="deliverable"
                  value={form.deliverable}
                  onChange={set("deliverable")}
                  placeholder="Thumbnails, jersey edit, reel cover…"
                  {...focusHandlers("deliverable")}
                />
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Deadline <em>(optional)</em></span>
              <div className="inquiry-form__control">
                <input
                  name="deadline"
                  value={form.deadline}
                  onChange={set("deadline")}
                  placeholder="e.g. 12 Aug"
                  {...focusHandlers("deadline")}
                />
              </div>
            </label>

            <label className="inquiry-form__field">
              <span>Budget <em>(optional)</em></span>
              <div className="inquiry-form__control">
                <input
                  name="budget"
                  value={form.budget}
                  onChange={set("budget")}
                  placeholder="Rough range"
                  {...focusHandlers("budget")}
                />
              </div>
            </label>

            <label className="inquiry-form__field inquiry-form__field--full">
              <span>Brief</span>
              <div className="inquiry-form__control">
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="What are we making, and who is it for?"
                  {...focusHandlers("message")}
                />
              </div>
            </label>
          </div>

          <div className="inquiry-form__foot">
            <button
              type="submit"
              className="inquiry-form__submit"
              disabled={status === "sending"}
              onPointerDown={onSubmitPointerDown}
            >
              <span className="inquiry-form__submit-label">
                {status === "sending" ? "Flattening…" : "Flatten & send"}
              </span>
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
        </div>
      </div>
    </form>
  );
}
