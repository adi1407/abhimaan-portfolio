"use client";

/**
 * Empty interactive hero — placeholder for the next motion phase.
 * Navbar is the primary UI on first paint; studio content lives below.
 */
export function HomeHero() {
  return (
    <section className="hero hero--empty" aria-label="Home">
      <div className="hero__void" aria-hidden />
    </section>
  );
}
