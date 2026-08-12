"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageReplace } from "@/features/admin/components/admin-media";

type Social = { label: string; href: string };

type Settings = {
  name: string;
  description: string;
  email: string;
  logo: string;
  logoMediaId?: string | null;
  ogImage: string;
  ogMediaId?: string | null;
  socials: Social[];
};

const EMPTY: Settings = {
  name: "",
  description: "",
  email: "",
  logo: "",
  ogImage: "",
  socials: [],
};

export function AdminSettings() {
  const [body, setBody] = useState<Settings>(EMPTY);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pages/settings", {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { body: Settings };
    setBody({ ...EMPTY, ...data.body, socials: data.body.socials ?? [] });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next = body) => {
    const res = await fetch("/api/admin/pages/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: next }),
    });
    setStatus(res.ok ? "Saved" : "Save failed");
  };

  return (
    <div className="admin-cms">
      <label className="admin-login__field">
        <span>Site name</span>
        <input
          className="admin-input"
          value={body.name}
          onChange={(e) => setBody({ ...body, name: e.target.value })}
        />
      </label>
      <label className="admin-login__field">
        <span>Tagline</span>
        <input
          className="admin-input"
          value={body.description}
          onChange={(e) => setBody({ ...body, description: e.target.value })}
        />
      </label>
      <label className="admin-login__field">
        <span>Email</span>
        <input
          className="admin-input"
          value={body.email}
          onChange={(e) => setBody({ ...body, email: e.target.value })}
        />
      </label>
      <div className="admin-card__row">
        <div>
          <p className="admin-card__kicker">Logo</p>
          <ImageReplace
            src={body.logo}
            mediaId={body.logoMediaId}
            onUploaded={(media) => {
              const next = {
                ...body,
                logo: media.src,
                logoMediaId: media.id,
              };
              setBody(next);
              void save(next);
            }}
          />
        </div>
        <div>
          <p className="admin-card__kicker">OG image</p>
          <ImageReplace
            src={body.ogImage}
            mediaId={body.ogMediaId}
            onUploaded={(media) => {
              const next = {
                ...body,
                ogImage: media.src,
                ogMediaId: media.id,
              };
              setBody(next);
              void save(next);
            }}
          />
        </div>
      </div>
      <p className="admin-card__kicker">Socials</p>
      {body.socials.map((s, i) => (
        <div key={`${s.label}-${i}`} className="admin-card__row">
          <input
            className="admin-input"
            value={s.label}
            onChange={(e) => {
              const socials = body.socials.map((row, idx) =>
                idx === i ? { ...row, label: e.target.value } : row,
              );
              setBody({ ...body, socials });
            }}
          />
          <input
            className="admin-input"
            value={s.href}
            onChange={(e) => {
              const socials = body.socials.map((row, idx) =>
                idx === i ? { ...row, href: e.target.value } : row,
              );
              setBody({ ...body, socials });
            }}
          />
        </div>
      ))}
      <div className="admin-cms__toolbar">
        <button type="button" className="admin-btn" onClick={() => void save()}>
          Save settings
        </button>
        {status ? <p className="admin-page__muted">{status}</p> : null}
      </div>
    </div>
  );
}
