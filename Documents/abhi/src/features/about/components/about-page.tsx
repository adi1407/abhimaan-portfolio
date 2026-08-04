import { AboutBoot } from "@/features/about/components/about-boot";
import { KineticCreate } from "@/features/about/components/kinetic-create";
import { AboutManifesto } from "@/features/about/components/about-manifesto";
import { AboutToolkit } from "@/features/about/components/about-toolkit";
import { CreativeDna } from "@/features/about/components/creative-dna";
import { CreativeUniverse } from "@/features/about/components/creative-universe";
import { AboutRuler } from "@/features/about/components/about-ruler";

/**
 * About — a six-act journey through how the work gets made.
 *
 * Tonally it opens in the site's light editorial language and inverts to the
 * same navy pushed near-black for the workspace act, so the cinematic moment
 * is earned by the palette already in use rather than imported.
 */
export function AboutPage() {
  return (
    <div className="about">
      <AboutRuler />

      <div id="act-intro">
        <AboutBoot />
      </div>

      <div id="act-create">
        <KineticCreate />
      </div>

      <div id="act-approach">
        <AboutManifesto />
      </div>

      <div id="act-tools">
        <AboutToolkit />
      </div>

      <div id="act-dna">
        <CreativeDna />
      </div>

      <CreativeUniverse />
    </div>
  );
}
