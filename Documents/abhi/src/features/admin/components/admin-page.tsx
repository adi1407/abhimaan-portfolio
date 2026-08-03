"use client";

import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
import { INQUIRY_SERVICES, type Inquiry } from "@/lib/inquiries/types";

function serviceLabel(id: Inquiry["service"]) {
  return INQUIRY_SERVICES.find((s) => s.id === id)?.label ?? id;
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", { credentials: "include" });
      if (res.status === 401) {
        setAuthed(false);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items: Inquiry[] };
      setItems(data.items ?? []);
      setAuthed(true);
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" });
        const data = (await res.json()) as { authenticated: boolean };
        if (cancelled) return;
        if (data.authenticated) {
          setAuthed(true);
          await loadInbox();
        } else {
          setAuthed(false);
        }
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInbox]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoginError(data.error || "Login failed.");
        return;
      }
      setPassword("");
      setAuthed(true);
      await loadInbox();
    } catch {
      setLoginError("Network error.");
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthed(false);
    setItems([]);
    setSelected(null);
  };

  const markRead = async (id: string, read: boolean) => {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ read }),
    });
    if (!res.ok) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read } : item)),
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this inquiry?")) return;
    const res = await fetch(`/api/inquiries/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selected === id) setSelected(null);
  };

  const active = items.find((item) => item.id === selected) ?? null;
  const unread = items.filter((item) => !item.read).length;

  if (authed === null) {
    return (
      <section className="admin-page">
        <Container>
          <p className="admin-page__muted">Checking session…</p>
        </Container>
      </section>
    );
  }

  if (!authed) {
    return (
      <section className="admin-page">
        <Container>
          <header className="admin-page__head">
            <p className="admin-page__eyebrow">Studio</p>
            <h1 className="admin-page__title">Admin</h1>
            <p className="admin-page__lede">
              Sign in to read Photoshop / post requests from the contact form.
            </p>
          </header>

          <form className="admin-login" onSubmit={onLogin}>
            <label className="admin-login__field">
              <span>Username</span>
              <input
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="admin-login__field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="admin-login__submit" disabled={loggingIn}>
              {loggingIn ? "Signing in…" : "Enter inbox"}
            </button>
            {loginError ? (
              <p className="admin-login__error" role="alert">
                {loginError}
              </p>
            ) : null}
          </form>
        </Container>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <Container>
        <header className="admin-page__head admin-page__head--row">
          <div>
            <p className="admin-page__eyebrow">Inbox</p>
            <h1 className="admin-page__title">Requests</h1>
            <p className="admin-page__lede">
              {items.length} total
              {unread ? ` · ${unread} unread` : ""}
            </p>
          </div>
          <div className="admin-page__actions">
            <button type="button" className="admin-btn" onClick={() => loadInbox()}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="admin-inbox">
          <ul className="admin-inbox__list">
            {items.length === 0 ? (
              <li className="admin-page__muted">No requests yet.</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={
                      item.id === selected
                        ? "admin-inbox__row is-active"
                        : item.read
                          ? "admin-inbox__row"
                          : "admin-inbox__row is-unread"
                    }
                    onClick={() => {
                      setSelected(item.id);
                      if (!item.read) void markRead(item.id, true);
                    }}
                  >
                    <span className="admin-inbox__name">{item.name}</span>
                    <span className="admin-inbox__meta">
                      {serviceLabel(item.service)} · {formatWhen(item.createdAt)}
                    </span>
                    <span className="admin-inbox__snippet">{item.message}</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <article className="admin-inbox__detail">
            {!active ? (
              <p className="admin-page__muted">Select a request to read it.</p>
            ) : (
              <>
                <header className="admin-detail__head">
                  <h2>{active.name}</h2>
                  <p>{formatWhen(active.createdAt)}</p>
                </header>
                <dl className="admin-detail__meta">
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${active.email}`}>{active.email}</a>
                    </dd>
                  </div>
                  {active.phone ? (
                    <div>
                      <dt>Phone</dt>
                      <dd>{active.phone}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Service</dt>
                    <dd>{serviceLabel(active.service)}</dd>
                  </div>
                  {active.deliverable ? (
                    <div>
                      <dt>Deliverable</dt>
                      <dd>{active.deliverable}</dd>
                    </div>
                  ) : null}
                  {active.deadline ? (
                    <div>
                      <dt>Deadline</dt>
                      <dd>{active.deadline}</dd>
                    </div>
                  ) : null}
                  {active.budget ? (
                    <div>
                      <dt>Budget</dt>
                      <dd>{active.budget}</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="admin-detail__body">{active.message}</p>
                <div className="admin-detail__actions">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => markRead(active.id, !active.read)}
                  >
                    Mark {active.read ? "unread" : "read"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => remove(active.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      </Container>
    </section>
  );
}
