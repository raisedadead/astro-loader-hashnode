/**
 * Core Hashnode API types - keeping close to the actual API response structure
 */

export interface HashnodeAuthor {
  id: string;
  name: string;
  username: string;
  profilePicture?: string;
  bio?: {
    text?: string;
    html?: string;
  };
  socialMediaLinks?: {
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  followersCount?: number;
}

export interface HashnodeTag {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tagline?: string;
  followersCount?: number;
}

export interface HashnodeCoverImage {
  url: string;
  attribution?: string;
  isPortrait?: boolean;
  isAttributionHidden?: boolean;
}

export interface HashnodeTableOfContents {
  isEnabled: boolean;
  items: Array<{
    id: string;
    level: number;
    parentId?: string;
    slug: string;
    title: string;
  }>;
}

export interface HashnodePost {
  id: string;
  cuid?: string;
  title: string;
  subtitle?: string;
  brief: string;
  slug: string;
  url?: string;
  canonicalUrl?: string;
  content: {
    html: string;
    markdown?: string;
  };
  coverImage?: HashnodeCoverImage;
  publishedAt: string;
  updatedAt?: string;
  createdAt?: string;
  readTimeInMinutes: number;
  views?: number;
  reactionCount?: number;
  responseCount?: number;
  replyCount?: number;
  hasLatexInPost?: boolean;
  author: HashnodeAuthor;
  coAuthors?: HashnodeAuthor[];
  tags: HashnodeTag[];
  seo?: {
    title?: string;
    description?: string;
  };
  ogMetaData?: {
    image?: string;
  };
  series?: {
    id: string;
    name?: string;
    slug?: string;
  };
  features?: {
    tableOfContents?: HashnodeTableOfContents;
  };
  preferences?: {
    disableComments?: boolean;
    stickCoverToBottom?: boolean;
  };
  comments?: {
    totalDocuments: number;
    edges: Array<{
      node: HashnodeComment;
    }>;
  };
  publication?: HashnodePublication;
}

export interface HashnodeComment {
  id: string;
  dateAdded: string;
  totalReactions: number;
  content: {
    html: string;
    markdown?: string;
  };
  author: HashnodeAuthor;
  replies?: {
    edges: Array<{
      node: HashnodeComment;
    }>;
  };
}

export interface HashnodeSeries {
  id: string;
  name: string;
  slug: string;
  description?: {
    html: string;
    markdown?: string;
    text?: string;
  };
  coverImage?: string;
  cuid?: string;
  createdAt?: string;
  updatedAt?: string;
  sortOrder?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  author: HashnodeAuthor;
  posts: {
    edges: Array<{
      node: HashnodePost;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string;
    };
  };
}

export interface HashnodeStaticPage {
  id: string;
  slug: string;
  title: string;
  content: {
    html: string;
    markdown?: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  ogMetaData?: {
    image?: string;
  };
}

export interface HashnodePublication {
  id: string;
  title: string;
  displayTitle?: string;
  url: string;
  urlPattern?: string;
  metaTags?: string;
  favicon?: string;
  isTeam?: boolean;
  headerColor?: string;
  followersCount?: number;
  descriptionSEO?: string;
  about?: {
    html?: string;
    markdown?: string;
  };
  author: HashnodeAuthor;
  ogMetaData?: {
    image?: string;
  };
  preferences?: {
    layout?: string;
    logo?: string;
    disableFooterBranding?: boolean;
    enabledPages?: {
      newsletter?: boolean;
      members?: boolean;
    };
    darkMode?: {
      enabled?: boolean;
      logo?: string;
    };
  };
  links?: {
    twitter?: string;
    instagram?: string;
    github?: string;
    website?: string;
    hashnode?: string;
    youtube?: string;
    linkedin?: string;
    mastodon?: string;
  };
  integrations?: {
    umamiWebsiteUUID?: string;
    gaTrackingID?: string;
    fbPixelID?: string;
    hotjarSiteID?: string;
    matomoURL?: string;
    matomoSiteID?: string;
    fathomSiteID?: string;
    gTagManagerID?: string;
    fathomCustomDomain?: string;
    fathomCustomDomainEnabled?: boolean;
    plausibleAnalyticsEnabled?: boolean;
    koalaPublicKey?: string;
    msClarityID?: string;
  };
  features?: {
    customCSS?: {
      isEnabled?: boolean;
      published?: {
        home?: string;
        post?: string;
        static?: string;
      };
    };
    newsletter?: {
      isEnabled: boolean;
    };
    viewCount?: {
      isEnabled: boolean;
    };
    readTime?: {
      isEnabled: boolean;
    };
    audioBlog?: {
      isEnabled: boolean;
      voiceType?: string;
    };
    textSelectionSharer?: {
      isEnabled: boolean;
    };
  };
  posts?: {
    totalDocuments: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      node: HashnodePost;
    }>;
  };
  staticPages?: {
    edges: Array<{
      node: HashnodeStaticPage;
    }>;
  };
  series?: HashnodeSeries[];
  pinnedPost?: HashnodePost;
  recentPosts?: {
    edges: Array<{
      node: HashnodePost;
    }>;
  };
}

export interface HashnodeApiResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

export interface HashnodePageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
}

// Table of contents item type
export type TableOfContentsItem = {
  id: string;
  level: number;
  parentId?: string;
  slug: string;
  title: string;
};

// Transformed content types (aliases for backward compatibility)
export type TransformedPost = Record<string, unknown>; // Will be defined by the post schema
export type TransformedSeries = Record<string, unknown>; // Will be defined by the series schema
export type TransformedSearch = Record<string, unknown>; // Will be defined by the search schema
export type TransformedDraft = Record<string, unknown>; // Will be defined by the draft schema
