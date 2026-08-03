import { Container } from "@/components/layout/container";
import {
  BEHANCE,
  getBehanceCollectionUrl,
  getBehanceProfileUrl,
  isBehanceLinked,
  WORK_CATEGORIES,
} from "@/lib/work";

/**
 * Dedicated “connection desk” under the Work plate.
 * Behance is linked / curated — never presented as a live autofetch feed.
 */
export function BehanceBridge() {
  const profile = getBehanceProfileUrl();
  const linked = isBehanceLinked();

  return (
    <section className="bb" aria-label="Behance bridge">
      <Container>
        <div className="bb__desk">
          <span className="bb__ghost" aria-hidden>
            Bé
          </span>

          <div className="bb__main">
            <p className="bb__eyebrow">Bridge</p>
            <h2 className="bb__title">{BEHANCE.displayName}</h2>
            <p className="bb__copy">
              Projects are curated on this site. Behance is the public case-study
              home for {BEHANCE.displayName} — linked here, not auto-fetched
              (Adobe no longer issues Behance API keys for new apps).
            </p>

            <div className="bb__status">
              <span
                className={
                  linked ? "bb__chip bb__chip--on" : "bb__chip bb__chip--off"
                }
              >
                {linked ? "Linked · curated" : "Not linked yet"}
              </span>
              {BEHANCE.username ? (
                <span className="bb__handle">@{BEHANCE.username}</span>
              ) : null}
            </div>

            <div className="bb__actions">
              {profile ? (
                <a
                  href={profile}
                  className="bb__cta"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open on Behance
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <p className="bb__hint">
                  Set <code>BEHANCE.profileUrl</code> in{" "}
                  <code>src/lib/work.ts</code> to connect.
                </p>
              )}
            </div>
          </div>

          <ul className="bb__cuts">
            {WORK_CATEGORIES.map((cat) => {
              const url = getBehanceCollectionUrl(cat.id);
              return (
                <li key={cat.id} className="bb__cut">
                  <span className="bb__cut-label">{cat.short}</span>
                  {url ? (
                    <a
                      href={url}
                      className="bb__cut-link"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open on Behance ↗
                    </a>
                  ) : (
                    <span className="bb__cut-muted">Add collection URL</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
