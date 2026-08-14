"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageReplace, uploadMedia } from "@/features/admin/components/admin-media";
import type { CmsWorkCategory, CmsWorkItem } from "@/lib/cms/types";
import { cn } from "@/lib/cn";

function defaultAspect(categoryId: string) {
  return categoryId === "thumbnails" ? "wide" : "square";
}

function addLabel(cat?: CmsWorkCategory) {
  if (!cat) return "Add work";
  const name = (cat.short || cat.label).toLowerCase();
  if (name === "books" || name === "book") return "Add book work";
  if (name.endsWith("s")) return `Add ${name.slice(0, -1)}`;
  return `Add ${name}`;
}

export function AdminWork() {
  const [categories, setCategories] = useState<CmsWorkCategory[]>([]);
  const [items, setItems] = useState<CmsWorkItem[]>([]);
  const [filter, setFilter] = useState("thumbnails");
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingCategory = useRef<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/work", { credentials: "include" });
    if (!res.ok) {
      setError("Could not load work. Sign in again if this persists.");
      return;
    }
    const data = (await res.json()) as {
      categories: CmsWorkCategory[];
      items: CmsWorkItem[];
    };
    setCategories(data.categories ?? []);
    setItems(data.items ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  const counts = (id: string) =>
    id === "all"
      ? items.length
      : items.filter((i) => i.category === id).length;

  const saveItem = async (item: CmsWorkItem) => {
    const res = await fetch(`/api/admin/work/items/${item.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: item.category,
        title: item.title,
        year: item.year,
        aspect: item.aspect,
        sort: item.sort,
        behanceUrl: item.behanceUrl ?? "",
        mediaId: item.mediaId,
      }),
    });
    if (!res.ok) {
      setError("Save failed.");
      return;
    }
    await load();
  };

  const createItem = async (category: string, file?: File) => {
    setAdding(category);
    setError("");
    try {
      let mediaId: string | undefined;
      let title = "New work";
      if (file) {
        const media = await uploadMedia(file, file.name);
        mediaId = media.id;
        title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      }
      const res = await fetch("/api/admin/work/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          year: String(new Date().getFullYear()),
          aspect: defaultAspect(category),
          mediaId: mediaId ?? null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Could not add work");
      }
      setFilter(category);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add work");
    } finally {
      setAdding(null);
    }
  };

  const startAdd = (category: string) => {
    pendingCategory.current = category;
    fileRef.current?.click();
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const category = pendingCategory.current;
    pendingCategory.current = null;
    if (!file || !category) return;
    await createItem(category, file);
  };

  const addBlank = async (category: string) => {
    await createItem(category);
  };

  return (
    <div className="admin-cms">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4"
        hidden
        onChange={onPickFile}
      />

      <div className="admin-work__cats" role="tablist" aria-label="Work categories">
        <button
          type="button"
          className={cn("admin-work__cat", filter === "all" && "is-on")}
          onClick={() => setFilter("all")}
        >
          All <span>{counts("all")}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={cn("admin-work__cat", filter === c.id && "is-on")}
            onClick={() => setFilter(c.id)}
          >
            {c.short} <span>{counts(c.id)}</span>
          </button>
        ))}
      </div>

      <div className="admin-work__addbar">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="admin-btn"
            disabled={adding !== null}
            onClick={() => startAdd(c.id)}
          >
            {adding === c.id ? "Adding…" : addLabel(c)}
          </button>
        ))}
        {filter !== "all" ? (
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={adding !== null}
            onClick={() => addBlank(filter)}
          >
            Add without image
          </button>
        ) : null}
      </div>
      <p className="admin-page__muted">
        Choose a type, pick an image — it lands in that category on the live site.
      </p>
      {error ? (
        <p className="admin-login__error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="admin-cms__grid">
        {filter !== "all"
          ? categories
              .filter((c) => c.id === filter)
              .map((c) => (
                <li key={`add-${c.id}`}>
                  <button
                    type="button"
                    className="admin-card admin-work__drop"
                    disabled={adding !== null}
                    onClick={() => startAdd(c.id)}
                  >
                    <span className="admin-work__plus" aria-hidden>
                      +
                    </span>
                    <strong>{addLabel(c)}</strong>
                    <small>Click to upload an image</small>
                  </button>
                </li>
              ))
          : null}
        {visible.map((item) => (
          <li key={item.id} className="admin-card">
            <p className="admin-card__kicker">
              {categories.find((c) => c.id === item.category)?.short ?? item.category}
            </p>
            <ImageReplace
              src={item.src}
              mediaId={item.mediaId}
              label={item.src ? "Replace" : "Upload image"}
              onUploaded={async (media) => {
                if (item.mediaId) {
                  await load();
                  return;
                }
                await saveItem({ ...item, mediaId: media.id, src: media.src });
              }}
            />
            <input
              className="admin-input"
              value={item.title}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((p) =>
                    p.id === item.id ? { ...p, title: e.target.value } : p,
                  ),
                )
              }
              onBlur={(e) => void saveItem({ ...item, title: e.target.value })}
            />
            <div className="admin-card__row">
              <input
                className="admin-input"
                value={item.year}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((p) =>
                      p.id === item.id ? { ...p, year: e.target.value } : p,
                    ),
                  )
                }
                onBlur={(e) => void saveItem({ ...item, year: e.target.value })}
              />
              <select
                className="admin-input"
                value={item.category}
                onChange={(e) => {
                  const next = { ...item, category: e.target.value };
                  setItems((prev) =>
                    prev.map((p) => (p.id === item.id ? next : p)),
                  );
                  void saveItem(next);
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={async () => {
                if (!window.confirm("Delete this work item?")) return;
                await fetch(`/api/admin/work/items/${item.id}`, {
                  method: "DELETE",
                  credentials: "include",
                });
                await load();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="admin-page__muted">Nothing here yet — use Add above.</p>
      ) : null}
    </div>
  );
}
