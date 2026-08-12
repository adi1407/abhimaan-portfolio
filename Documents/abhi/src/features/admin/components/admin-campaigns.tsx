"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageReplace, uploadMedia } from "@/features/admin/components/admin-media";
import type { CmsCampaign } from "@/lib/cms/types";

export function AdminCampaigns() {
  const [items, setItems] = useState<CmsCampaign[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/campaigns", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: CmsCampaign[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (camp: CmsCampaign) => {
    await fetch(`/api/admin/campaigns/${camp.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: camp.title,
        subtitle: camp.subtitle,
        layout: camp.layout,
        coverMediaId: camp.coverMediaId,
      }),
    });
    await load();
  };

  return (
    <div className="admin-cms">
      {items.map((camp) => (
        <article key={camp.id} className="admin-block">
          <header className="admin-block__head">
            <input
              className="admin-input"
              value={camp.title}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((c) =>
                    c.id === camp.id ? { ...c, title: e.target.value } : c,
                  ),
                )
              }
              onBlur={() => save(camp)}
            />
            <input
              className="admin-input"
              value={camp.subtitle}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((c) =>
                    c.id === camp.id ? { ...c, subtitle: e.target.value } : c,
                  ),
                )
              }
              onBlur={() => save(camp)}
            />
          </header>
          <div className="admin-cms__grid">
            {camp.images.map((img) => (
              <div key={img.rowId} className="admin-card">
                <ImageReplace
                  src={img.src}
                  mediaId={img.mediaId}
                  onUploaded={async (media) => {
                    if (img.mediaId) {
                      await load();
                      return;
                    }
                    await fetch(
                      `/api/admin/campaigns/${camp.id}/images/${img.rowId}`,
                      {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          label: img.label,
                          aspect: img.aspect ?? "",
                          mediaId: media.id,
                        }),
                      },
                    );
                    await load();
                  }}
                />
                <input
                  className="admin-input"
                  value={img.label}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((c) =>
                        c.id !== camp.id
                          ? c
                          : {
                              ...c,
                              images: c.images.map((i) =>
                                i.rowId === img.rowId
                                  ? { ...i, label: e.target.value }
                                  : i,
                              ),
                            },
                      ),
                    )
                  }
                  onBlur={async () => {
                    await fetch(
                      `/api/admin/campaigns/${camp.id}/images/${img.rowId}`,
                      {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          label: img.label,
                          aspect: img.aspect ?? "",
                          mediaId: img.mediaId,
                        }),
                      },
                    );
                  }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={async () => {
                    if (!window.confirm("Remove this image?")) return;
                    await fetch(
                      `/api/admin/campaigns/${camp.id}/images/${img.rowId}`,
                      { method: "DELETE", credentials: "include" },
                    );
                    await load();
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="admin-btn"
            onClick={async () => {
              const file = await pickFile();
              if (!file) return;
              const media = await uploadMedia(file);
              await fetch(`/api/admin/campaigns/${camp.id}/images`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  label: file.name,
                  mediaId: media.id,
                }),
              });
              await load();
            }}
          >
            Add image
          </button>
        </article>
      ))}
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
