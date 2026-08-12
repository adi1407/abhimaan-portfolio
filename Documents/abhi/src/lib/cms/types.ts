export type CmsMediaRef = {
  src: string;
  mediaId?: string | null;
};

export type CmsWorkCategory = {
  id: string;
  label: string;
  short: string;
  slot: string;
  blurb: string;
  sort: number;
  behanceUrl: string;
};

export type CmsWorkItem = {
  id: string;
  category: string;
  title: string;
  year: string;
  src: string;
  mediaId?: string | null;
  aspect: "portrait" | "square" | "wide" | string;
  sort: number;
  behanceUrl?: string | null;
};

export type CmsCampaignImage = {
  id: string;
  rowId: string;
  src: string;
  mediaId?: string | null;
  label: string;
  aspect?: string | null;
  sort: number;
};

export type CmsCampaign = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  coverMediaId?: string | null;
  layout: string;
  sort: number;
  images: CmsCampaignImage[];
};

export type CmsBookPage = {
  id: string;
  rowId: string;
  src: string;
  mediaId?: string | null;
  label: string;
  sort: number;
};

export type CmsBook = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  coverMediaId?: string | null;
  pages: CmsBookPage[];
  spreads: { left: CmsBookPage; right: CmsBookPage }[];
  backCover: CmsBookPage | null;
  spreadCount: number;
};

export type CmsBundle = {
  settings: Record<string, unknown>;
  home: Record<string, unknown>;
  about: Record<string, unknown>;
  contact: Record<string, unknown>;
  experience: Record<string, unknown>;
  footer: Record<string, unknown>;
  work: {
    categories: CmsWorkCategory[];
    items: CmsWorkItem[];
    behance: {
      username: string;
      displayName: string;
      profileUrl: string;
      collections: Record<string, string>;
    };
  };
  campaigns: CmsCampaign[];
  book: CmsBook | null;
};

export const EMPTY_BUNDLE: CmsBundle = {
  settings: {},
  home: {},
  about: {},
  contact: {},
  experience: {},
  footer: {},
  work: {
    categories: [],
    items: [],
    behance: {
      username: "",
      displayName: "",
      profileUrl: "",
      collections: {},
    },
  },
  campaigns: [],
  book: null,
};
