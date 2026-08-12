"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageReplace, uploadMedia } from "@/features/admin/components/admin-media";
import type { CmsBook } from "@/lib/cms/types";

export function AdminBook() {
  const [book, setBook] = useState<CmsBook | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/book", { credentials: "include" });
    if (!res.ok) return;
    setBook((await res.json()) as CmsBook);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!book) return <p className="admin-page__muted">No book yet.</p>;

  const saveMeta = async () => {
    await fetch("/api/admin/book", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: book.title,
        subtitle: book.subtitle,
        coverMediaId: book.coverMediaId,
      }),
    });
    await load();
  };

  return (
    <div className="admin-cms">
      <div className="admin-card__row">
        <input
          className="admin-input"
          value={book.title}
          onChange={(e) => setBook({ ...book, title: e.target.value })}
          onBlur={() => void saveMeta()}
        />
        <input
          className="admin-input"
          value={book.subtitle}
          onChange={(e) => setBook({ ...book, subtitle: e.target.value })}
          onBlur={() => void saveMeta()}
        />
      </div>
      <p className="admin-page__muted">
        {book.pages.length} pages · {book.spreadCount} spreads. Last page is the
        back cover.
      </p>
      <ul className="admin-cms__grid">
        {book.pages.map((page, i) => (
          <li key={page.rowId} className="admin-card">
            <p className="admin-card__kicker">
              {i === 0
                ? "Cover / page 1"
                : i === book.pages.length - 1
                  ? "Back cover"
                  : `Page ${i + 1}`}
            </p>
            <ImageReplace
              src={page.src}
              mediaId={page.mediaId}
              onUploaded={async (media) => {
                if (page.mediaId) {
                  await load();
                  return;
                }
                await fetch(`/api/admin/book/pages/${page.rowId}`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mediaId: media.id, label: page.label }),
                });
                await load();
              }}
            />
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={async () => {
                if (!window.confirm("Remove this page?")) return;
                await fetch(`/api/admin/book/pages/${page.rowId}`, {
                  method: "DELETE",
                  credentials: "include",
                });
                await load();
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="admin-btn"
        onClick={async () => {
          const file = await pickFile();
          if (!file) return;
          const media = await uploadMedia(file);
          await fetch("/api/admin/book/pages", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaId: media.id,
              label: `Page ${book.pages.length + 1}`,
            }),
          });
          await load();
        }}
      >
        Add page
      </button>
    </div>
  );
}

function pickFile() {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
