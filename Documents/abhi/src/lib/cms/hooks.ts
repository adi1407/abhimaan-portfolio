"use client";

import { useCms } from "@/lib/cms/provider";
import type { CmsBook, CmsCampaign, CmsWorkCategory, CmsWorkItem } from "@/lib/cms/types";

export function useWorkCategories(): CmsWorkCategory[] {
  return useCms().work.categories;
}

export function useWorkItems(): CmsWorkItem[] {
  return useCms().work.items;
}

export function useCampaigns(): CmsCampaign[] {
  return useCms().campaigns;
}

export function useBook(): CmsBook | null {
  return useCms().book;
}

export function useSettings<T extends Record<string, unknown>>() {
  return useCms().settings as T;
}

export function useHome<T extends Record<string, unknown>>() {
  return useCms().home as T;
}

export function useAbout<T extends Record<string, unknown>>() {
  return useCms().about as T;
}

export function useContactCopy<T extends Record<string, unknown>>() {
  return useCms().contact as T;
}

export function useExperience<T extends Record<string, unknown>>() {
  return useCms().experience as T;
}

export function useFooterCopy<T extends Record<string, unknown>>() {
  return useCms().footer as T;
}
