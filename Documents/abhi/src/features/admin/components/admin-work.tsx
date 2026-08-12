"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageReplace } from "@/features/admin/components/admin-media";
import type { CmsWorkCategory, CmsWorkItem } from "@/lib/cms/types";

export function AdminWork() {
  const [categories, setCategories] = useState<CmsWorkCategory[]>([]);
  const [items, setItems] = useState<CmsWorkItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/work", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      categories: CmsWorkCategory[];
      items: CmsWorkItem[];
    };
    setCategories(data.categories ?? []);
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  const saveItem = async (item: CmsWorkItem) => {
    await fetch(`/api/admin/work/items/${item.id}`, {
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
    await load();
  };

  const addItem = async () => {
    const category = filter === "all" ? categories[0]?.id : filter;
    if (!category) return;
    setAdding(true);
    try {
      await fetch("/api/admin/work/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: "New work",
          year: String(new Date().getFullYear()),
          aspect: "wide",
        }),
      });
      await load();
    } finally {
      setAdding(false);
    }
  };

  const addCategory = async () => {
    const short = window.prompt("Category short name?");
    if (!short) return;
    await fetch("/api/admin/work/categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: short,
        short,
        slot: "tl",
        blurb: "",
      }),
    });
    await load();
  };

  return (
    <div className="admin-cms">
      <div className="admin-cms__toolbar">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-input"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.short}
            </option>
          ))}
        </select>
        <button type="button" className="admin-btn" onClick={addItem} disabled={adding}>
          {adding ? "Adding…" : "Add work"}
        </button>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={addCategory}>
          Add category
        </button>
      </div>

      <ul className="admin-cms__grid">
        {visible.map((item) => (
          <li key={item.id} className="admin-card">
            <ImageReplace
              src={item.src}
              mediaId={item.mediaId}
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
        <p className="admin-page__muted">No work in this category yet.</p>
      ) : null}
    </div>
  );
}

