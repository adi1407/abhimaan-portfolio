import { Container } from "@/components/layout/container";
import { useWorkCategories } from "@/lib/cms/hooks";
import { useCms } from "@/lib/cms/provider";

export function BehanceBridge() {
  const cms = useCms();
  const categories = useWorkCategories();
  const behance = cms.work.behance;
  const profile = behance.profileUrl || null;
  const linked = Boolean(profile || behance.username);

  return (
    <section className="bb" aria-label="Behance bridge">
      <Container>
        <div className="bb__desk">
          <span className="bb__ghost" aria-hidden>
            Bé
          </span>

          <div className="bb__main">
            <p className="bb__eyebrow">Bridge</p>
            <h2 className="bb__title">{behance.displayName || "Behance"}</h2>
            <p className="bb__copy">
              Projects are curated on this site. Behance is the public case-study
              home for {behance.displayName || "this studio"} — linked here, not
              auto-fetched.
            </p>

            <div className="bb__status">
              <span
                className={
                  linked ? "bb__chip bb__chip--on" : "bb__chip bb__chip--off"
                }
              >
                {linked ? "Linked · curated" : "Not linked yet"}
              </span>
              {behance.username ? (
                <span className="bb__handle">@{behance.username}</span>
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
                <p className="bb__hint">Add a Behance URL in Admin → Work.</p>
              )}
            </div>
          </div>

          <ul className="bb__cuts">
            {categories.map((cat) => {
              const url = behance.collections[cat.id];
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
