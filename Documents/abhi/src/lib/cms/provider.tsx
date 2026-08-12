"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_BUNDLE, type CmsBundle } from "@/lib/cms/types";

const CmsContext = createContext<CmsBundle>(EMPTY_BUNDLE);

export function CmsProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<CmsBundle>(EMPTY_BUNDLE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/bundle", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as CmsBundle;
        if (!cancelled) setBundle({ ...EMPTY_BUNDLE, ...data });
      } catch {
        /* empty states if API is down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => bundle, [bundle]);
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  return useContext(CmsContext);
}
