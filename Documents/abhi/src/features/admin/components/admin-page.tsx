"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { AdminBook } from "@/features/admin/components/admin-book";
import { AdminCampaigns } from "@/features/admin/components/admin-campaigns";
import { AdminPages } from "@/features/admin/components/admin-pages";
import { AdminSettings } from "@/features/admin/components/admin-settings";
import { AdminWork } from "@/features/admin/components/admin-work";
import { INQUIRY_SERVICES, type Inquiry } from "@/lib/inquiries/types";
import { cn } from "@/lib/cn";

type Tab = "messages" | "work" | "campaigns" | "book" | "pages" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "messages", label: "Inbox" },
  { id: "work", label: "Work" },
  { id: "campaigns", label: "Campaigns" },
  { id: "book", label: "Book" },
  { id: "pages", label: "Pages" },
  { id: "settings", label: "Settings" },
];

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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "•";
}

export function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>("messages");
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const unread = items.filter((item) => !item.read).length;
  const active = items.find((item) => item.id === selected) ?? null;

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

  useLayoutEffect(() => {
    const root = tabsRef.current;
    if (!root) return;
    const update = () => {
      const on = root.querySelector<HTMLElement>(".admin-tabs__btn.is-on");
      if (!on) return;
      setPill({ left: on.offsetLeft, width: on.offsetWidth, ready: true });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    return () => ro.disconnect();
  }, [tab, authed, unread]);

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
      setLoginError("Network error. Try again.");
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

  if (authed === null) {
    return (
      <section className="admin-page admin-page--gate">
        <div className="admin-gate__fx" aria-hidden>
          <div className="admin-gate__grid" />
          <div className="admin-gate__glow" />
          <div className="admin-gate__grain" />
        </div>
        <div className="admin-boot">
          <span className="admin-boot__pulse" />
          <p>Opening studio…</p>
        </div>
      </section>
    );
  }

  if (!authed) {
    return (
      <section className="admin-page admin-page--gate">
        <div className="admin-gate__fx" aria-hidden>
          <div className="admin-gate__grid" />
          <div className="admin-gate__glow" />
          <div className="admin-gate__orb admin-gate__orb--a" />
          <div className="admin-gate__orb admin-gate__orb--b" />
          <div className="admin-gate__grain" />
        </div>
        <div className="admin-gate">
          <p className="admin-gate__kicker">
            <span className="admin-live" />
            Private studio
          </p>
          <h1 className="admin-gate__title">
            Enter
            <em> the desk.</em>
          </h1>
          <p className="admin-gate__lede">
            Messages, work, campaigns, and pages — one locked room behind the
            site.
          </p>
          <form
            className={cn("admin-login", loginError && "is-error")}
            onSubmit={onLogin}
          >
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
            <button
              type="submit"
              className="admin-login__submit"
              disabled={loggingIn}
            >
              <span>{loggingIn ? "Signing in…" : "Enter studio"}</span>
              <i className="admin-login__sheen" aria-hidden />
            </button>
            {loginError ? (
              <p className="admin-login__error" role="alert">
                {loginError}
              </p>
            ) : null}
          </form>
          <Link href="/" className="admin-gate__back">
            ← Back to site
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page admin-page--app">
      <div className="admin-app">
        <header className="admin-topbar">
          <Link href="/" className="admin-topbar__brand">
            <span className="admin-topbar__mark">A</span>
            <span>
              <strong>Abhi</strong>
              <small>Studio CMS</small>
            </span>
          </Link>
          <div className="admin-topbar__meta">
            <span className={cn("admin-pill", unread > 0 && "is-hot")}>
              <span className="admin-live" />
              {unread ? `${unread} unread` : "Inbox clear"}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        </header>

        <nav
          ref={tabsRef}
          className="admin-tabs"
          aria-label="Admin sections"
        >
          <span
            className={cn("admin-tabs__pill", pill.ready && "is-ready")}
            style={{
              transform: `translateX(${pill.left}px)`,
              width: pill.width,
            }}
            aria-hidden
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn("admin-tabs__btn", tab === t.id && "is-on")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "messages" && unread ? (
                <span className="admin-tabs__count">{unread}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div key={tab} className="admin-stage">
          {tab === "messages" ? (
            <div className="admin-inbox">
              <div className="admin-inbox__side">
                <div className="admin-cms__toolbar">
                  <p className="admin-card__kicker">Requests</p>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => loadInbox()}
                  >
                    {loading ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
                <ul className="admin-inbox__list">
                  {items.length === 0 ? (
                    <li className="admin-empty">
                      <span />
                      <p>No requests yet.</p>
                    </li>
                  ) : (
                    items.map((item, i) => (
                      <li
                        key={item.id}
                        style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                      >
                        <button
                          type="button"
                          className={cn(
                            "admin-inbox__row",
                            item.id === selected && "is-active",
                            !item.read && "is-unread",
                          )}
                          onClick={() => {
                            setSelected(item.id);
                            if (!item.read) void markRead(item.id, true);
                          }}
                        >
                          <span className="admin-inbox__avatar" aria-hidden>
                            {initials(item.name)}
                          </span>
                          <span className="admin-inbox__copy">
                            <span className="admin-inbox__name">{item.name}</span>
                            <span className="admin-inbox__meta">
                              {serviceLabel(item.service)} ·{" "}
                              {formatWhen(item.createdAt)}
                            </span>
                            <span className="admin-inbox__snippet">
                              {item.message}
                            </span>
                          </span>
                          {!item.read ? (
                            <span className="admin-inbox__dot" aria-label="Unread" />
                          ) : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <article
                key={active?.id ?? "empty"}
                className="admin-inbox__detail"
              >
                {!active ? (
                  <div className="admin-empty admin-empty--detail">
                    <span />
                    <p>Select a request to read it.</p>
                  </div>
                ) : (
                  <>
                    <header className="admin-detail__head">
                      <span className="admin-inbox__avatar is-lg" aria-hidden>
                        {initials(active.name)}
                      </span>
                      <div>
                        <h2>{active.name}</h2>
                        <p>{formatWhen(active.createdAt)}</p>
                      </div>
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
          ) : null}

          {tab === "work" ? <AdminWork /> : null}
          {tab === "campaigns" ? <AdminCampaigns /> : null}
          {tab === "book" ? <AdminBook /> : null}
          {tab === "pages" ? <AdminPages /> : null}
          {tab === "settings" ? <AdminSettings /> : null}
        </div>
      </div>
    </section>
  );
}
