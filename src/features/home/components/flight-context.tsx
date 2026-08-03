"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/* ================================================================== *
 * Flight context
 *
 * The plane has to paint above every section, so it lives outside the
 * hero; the ID card has to stay inside the hero for DOM and tab order.
 * They meet here: one hitch, written every frame by the plane and read
 * every physics step by the card, behind a tiny get/set controller so
 * neither side re-renders and neither side mutates the other's state.
 * ================================================================== */

export type Hitch = {
  /** Tail hitch in document px. */
  x: number;
  y: number;
  /** True while the plane still holds the card. */
  carrying: boolean;
  /** False until the plane has measured itself and posed once. */
  ready: boolean;
};

export type FlightController = {
  set: (next: Partial<Hitch>) => void;
  get: () => Readonly<Hitch>;
};

function createController(): FlightController {
  const hitch: Hitch = { x: 0, y: 0, carrying: true, ready: false };
  return {
    set: (next) => {
      Object.assign(hitch, next);
    },
    get: () => hitch,
  };
}

const FlightContext = createContext<FlightController | null>(null);

export function FlightProvider({ children }: { children: ReactNode }) {
  const controller = useMemo(() => createController(), []);
  return (
    <FlightContext.Provider value={controller}>
      {children}
    </FlightContext.Provider>
  );
}

/** The live hitch, or null when rendered outside a flight (About, Work). */
export function useFlight() {
  return useContext(FlightContext);
}
