"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageReplace } from "@/features/admin/components/admin-media";

const KEYS = [
  { id: "about", label: "About" },
  { id: "home", label: "Home" },
  { id: "contact", label: "Contact" },
  { id: "experience", label: "Experience" },
  { id: "footer", label: "Footer" },
] as const;

type Body = Record<string, unknown>;
type MediaItem = {
  id?: string;
  src?: string;
  mediaId?: string | null;
  label?: string;
  title?: string;
  name?: string;
};

function str(v: unknown) {
  return typeof v === "string" ? v : "";
}

function list(v: unknown): MediaItem[] {
  return Array.isArray(v) ? (v as MediaItem[]) : [];
}

export function AdminPages() {
  const [key, setKey] = useState<(typeof KEYS)[number]["id"]>("about");
  const [body, setBody] = useState<Body>({});
  const [status, setStatus] = useState("");

  const load = useCallback(async (k: string) => {
    const res = await fetch(`/api/admin/pages/${k}`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { body: Body };
    setBody(data.body ?? {});
  }, []);

  useEffect(() => {
    void load(key);
  }, [key, load]);

  const save = async (next = body) => {
    const res = await fetch(`/api/admin/pages/${key}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: next }),
    });
    setStatus(res.ok ? "Saved" : "Save failed");
  };

  const setPath = (path: string[], value: unknown) => {
    setBody((prev) => {
      const next = structuredClone(prev);
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < path.length - 1; i += 1) {
        const k = path[i];
        const child = cur[k];
        if (!child || typeof child !== "object") cur[k] = {};
        cur = cur[k] as Record<string, unknown>;
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const patchList = (
    path: string[],
    index: number,
    patch: Record<string, unknown>,
  ) => {
    setBody((prev) => {
      const next = structuredClone(prev);
      let parent: Record<string, unknown> = next;
      for (let i = 0; i < path.length - 1; i += 1) {
        const k = path[i];
        if (!parent[k] || typeof parent[k] !== "object") parent[k] = {};
        parent = parent[k] as Record<string, unknown>;
      }
      const last = path[path.length - 1];
      const arr = Array.isArray(parent[last])
        ? [...(parent[last] as MediaItem[])]
        : [];
      arr[index] = { ...arr[index], ...patch };
      parent[last] = arr;
      return next;
    });
  };

  const boot = (body.boot ?? {}) as Record<string, unknown>;
  const manifesto = (body.manifesto ?? {}) as Record<string, unknown>;
  const hero = (body.hero ?? {}) as Record<string, unknown>;
  const cta = (body.cta ?? {}) as Record<string, unknown>;
  const scraps = (body.scraps ?? {}) as Record<string, unknown>;
  const studio = (body.studio ?? {}) as Record<string, unknown>;
  const creators = (body.creators ?? {}) as Record<string, unknown>;
  const roles = list(body.roles);

  return (
    <div className="admin-cms">
      <div className="admin-cms__toolbar">
        {KEYS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={key === k.id ? "admin-btn" : "admin-btn admin-btn--ghost"}
            onClick={() => setKey(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {key === "about" ? (
        <>
          <Field
            label="Boot title"
            value={str(boot.title)}
            onChange={(v) => setPath(["boot", "title"], v)}
          />
          <Field
            label="Boot subtitle"
            value={str(boot.sub)}
            onChange={(v) => setPath(["boot", "sub"], v)}
            area
          />
          <Field
            label="Boot lines (one per line)"
            value={
              Array.isArray(boot.lines) ? (boot.lines as string[]).join("\n") : ""
            }
            onChange={(v) =>
              setPath(["boot", "lines"], v.split("\n").filter(Boolean))
            }
            area
          />
          <Field
            label="Manifesto headline"
            value={str(manifesto.headline)}
            onChange={(v) => setPath(["manifesto", "headline"], v)}
          />
          <Field
            label="Manifesto trio"
            value={
              Array.isArray(manifesto.lines)
                ? (manifesto.lines as string[]).join("\n")
                : str(manifesto.lines)
            }
            onChange={(v) =>
              setPath(["manifesto", "lines"], v.split("\n").filter(Boolean))
            }
          />
          <Field
            label="Manifesto body"
            value={str(manifesto.body)}
            onChange={(v) => setPath(["manifesto", "body"], v)}
            area
          />
        </>
      ) : null}

      {key === "home" ? (
        <>
          <Field
            label="Hero eyebrow"
            value={str(hero.eyebrow)}
            onChange={(v) => setPath(["hero", "eyebrow"], v)}
          />
          <Field
            label="Hero roles (one per line)"
            value={
              Array.isArray(hero.roles) ? (hero.roles as string[]).join("\n") : ""
            }
            onChange={(v) =>
              setPath(["hero", "roles"], v.split("\n").filter(Boolean))
            }
            area
          />
          <Field
            label="Hero lede"
            value={str(hero.lede)}
            onChange={(v) => setPath(["hero", "lede"], v)}
            area
          />
          <Field
            label="Hero CTA — work"
            value={str(hero.ctaWork)}
            onChange={(v) => setPath(["hero", "ctaWork"], v)}
          />
          <Field
            label="Hero CTA — contact"
            value={str(hero.ctaContact)}
            onChange={(v) => setPath(["hero", "ctaContact"], v)}
          />
          <Field
            label="CTA verbs (one per line)"
            value={
              Array.isArray(cta.verbs) ? (cta.verbs as string[]).join("\n") : ""
            }
            onChange={(v) =>
              setPath(["cta", "verbs"], v.split("\n").filter(Boolean))
            }
            area
          />
          <Field
            label="CTA line"
            value={str(cta.line)}
            onChange={(v) => setPath(["cta", "line"], v)}
          />
          <Field
            label="CTA note"
            value={str(cta.note)}
            onChange={(v) => setPath(["cta", "note"], v)}
          />

          <p className="admin-card__kicker">Desk scraps</p>
          {list(scraps.items).map((item, i) => (
            <div key={item.id ?? i} className="admin-card">
              <ImageReplace
                src={item.src}
                mediaId={item.mediaId}
                onUploaded={(media) => {
                  const items = list(scraps.items).map((row, idx) =>
                    idx === i
                      ? { ...row, src: media.src, mediaId: media.id }
                      : row,
                  );
                  setPath(["scraps", "items"], items);
                }}
              />
              <Field
                label="Title"
                value={str(item.title)}
                onChange={(v) =>
                  patchList(["scraps", "items"], i, { title: v })
                }
              />
            </div>
          ))}

          <p className="admin-card__kicker">Studio layers</p>
          {list(studio.layers).map((item, i) => (
            <div key={item.id ?? i} className="admin-card">
              <ImageReplace
                src={item.src}
                mediaId={item.mediaId}
                onUploaded={(media) => {
                  const items = list(studio.layers).map((row, idx) =>
                    idx === i
                      ? { ...row, src: media.src, mediaId: media.id }
                      : row,
                  );
                  setPath(["studio", "layers"], items);
                }}
              />
              <Field
                label="Label"
                value={str(item.label)}
                onChange={(v) =>
                  patchList(["studio", "layers"], i, { label: v })
                }
              />
            </div>
          ))}

          <p className="admin-card__kicker">Creators</p>
          {list(creators.items).map((item, i) => (
            <div key={item.id ?? item.name ?? i} className="admin-card">
              <ImageReplace
                src={item.src}
                mediaId={item.mediaId}
                onUploaded={(media) => {
                  const items = list(creators.items).map((row, idx) =>
                    idx === i
                      ? { ...row, src: media.src, mediaId: media.id }
                      : row,
                  );
                  setPath(["creators", "items"], items);
                }}
              />
              <Field
                label="Name"
                value={str(item.name)}
                onChange={(v) =>
                  patchList(["creators", "items"], i, { name: v })
                }
              />
            </div>
          ))}
        </>
      ) : null}

      {key === "contact" ? (
        <>
          <Field
            label="Eyebrow"
            value={str(body.eyebrow)}
            onChange={(v) => setPath(["eyebrow"], v)}
          />
          <Field
            label="Verbs (one per line)"
            value={
              Array.isArray(body.verbs) ? (body.verbs as string[]).join("\n") : ""
            }
            onChange={(v) => setPath(["verbs"], v.split("\n").filter(Boolean))}
            area
          />
          <Field
            label="SLA"
            value={str(body.sla)}
            onChange={(v) => setPath(["sla"], v)}
          />
          <Field
            label="Success message"
            value={str(body.success)}
            onChange={(v) => setPath(["success"], v)}
          />
          <Field
            label="Lines (one per line)"
            value={
              Array.isArray(body.lines) ? (body.lines as string[]).join("\n") : ""
            }
            onChange={(v) => setPath(["lines"], v.split("\n").filter(Boolean))}
            area
          />
        </>
      ) : null}

      {key === "experience" ? (
        <>
          <Field
            label="Intro"
            value={str(body.intro)}
            onChange={(v) => setPath(["intro"], v)}
            area
          />
          {roles.map((role, i) => (
            <div key={str(role.id) || i} className="admin-block">
              <Field
                label="Year"
                value={str((role as Record<string, unknown>).year)}
                onChange={(v) => patchList(["roles"], i, { year: v })}
              />
              <Field
                label="Role"
                value={str((role as Record<string, unknown>).role)}
                onChange={(v) => patchList(["roles"], i, { role: v })}
              />
              <Field
                label="Company"
                value={str((role as Record<string, unknown>).company)}
                onChange={(v) => patchList(["roles"], i, { company: v })}
              />
              <Field
                label="Summary"
                value={str((role as Record<string, unknown>).summary)}
                onChange={(v) => patchList(["roles"], i, { summary: v })}
                area
              />
            </div>
          ))}
        </>
      ) : null}

      {key === "footer" ? (
        <>
          <Field
            label="Blurb"
            value={str(body.blurb)}
            onChange={(v) => setPath(["blurb"], v)}
            area
          />
          <Field
            label="Copyright"
            value={str(body.copyright)}
            onChange={(v) => setPath(["copyright"], v)}
          />
          <Field
            label="Marquee (one per line)"
            value={
              Array.isArray(body.marquee)
                ? (body.marquee as string[]).join("\n")
                : ""
            }
            onChange={(v) => setPath(["marquee"], v.split("\n").filter(Boolean))}
            area
          />
        </>
      ) : null}

      <div className="admin-cms__toolbar">
        <button type="button" className="admin-btn" onClick={() => void save()}>
          Save {key}
        </button>
        {status ? <p className="admin-page__muted">{status}</p> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <label className="admin-login__field">
      <span>{label}</span>
      {area ? (
        <textarea
          className="admin-textarea"
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
