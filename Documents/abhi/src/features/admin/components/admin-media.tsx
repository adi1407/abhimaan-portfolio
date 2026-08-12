"use client";

export async function uploadMedia(file: File, alt = "") {
  const body = new FormData();
  body.append("file", file);
  if (alt) body.append("alt", alt);
  const res = await fetch("/api/admin/media", {
    method: "POST",
    credentials: "include",
    body,
  });
  const data = (await res.json()) as { id?: string; src?: string; error?: string };
  if (!res.ok || !data.id) throw new Error(data.error || "Upload failed");
  return data as { id: string; src: string };
}

export async function replaceMedia(mediaId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api/admin/media/${mediaId}`, {
    method: "POST",
    credentials: "include",
    body,
  });
  const data = (await res.json()) as { id?: string; src?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Replace failed");
  return data;
}

export function ImageReplace({
  src,
  mediaId,
  onUploaded,
  label = "Replace",
}: {
  src?: string;
  mediaId?: string | null;
  onUploaded: (media: { id: string; src: string }) => void;
  label?: string;
}) {
  return (
    <label className="admin-media">
      <span className="admin-media__frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="admin-media__img" />
        ) : (
          <span className="admin-media__ph">Drop or click</span>
        )}
        <span className="admin-media__veil">{label}</span>
      </span>
      <input
        type="file"
        accept="image/*,video/mp4"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (mediaId) {
              const next = await replaceMedia(mediaId, file);
              onUploaded({ id: mediaId, src: `${next.src}?t=${Date.now()}` });
            } else {
              onUploaded(await uploadMedia(file));
            }
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Upload failed");
          }
        }}
      />
    </label>
  );
}
