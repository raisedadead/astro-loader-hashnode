/**
 * Core loader types - replacing any types with proper TypeScript interfaces
 */

import type { HashnodePost, HashnodeSeries } from './hashnode.js';

// Define proper types for loader configurations
export interface LoaderConfig {
  loader: AstroLoader;
}

export interface AstroLoader {
  name: string;
  load: (context: LoaderContext) => Promise<void>;
}

export interface LoaderContext {
  store: DataStore;
  logger: Logger;
  parseData: (data: unknown) => Promise<unknown>;
}

export interface DataStore {
  set: (entry: DataEntry) => void;
  get: (id: string) => DataEntry | undefined;
  has: (id: string) => boolean;
  clear: () => void;
  keys: () => string[];
  delete: (id: string) => boolean;
}

export interface DataEntry {
  id: string;
  data: {
    id: string;
    data: unknown;
  };
  digest: string;
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

// Define types for loader options unions
export type AnyLoaderOptions =
  | import('./loader.js').PostsLoaderOptions
  | import('./loader.js').SeriesLoaderOptions
  | import('./loader.js').SearchLoaderOptions
  | import('./loader.js').DraftsLoaderOptions;

// Define types for GraphQL responses
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}

// Define types for cache entries
export interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

// Define types for processed content
export interface ProcessedContent {
  html: string;
  text: string;
  excerpt?: string;
  readingTime?: number;
  wordCount: number;
  headings?: Array<{
    level: number;
    text: string;
    id?: string;
  }>;
  tableOfContents?: Array<{
    id: string;
    level: number;
    title: string;
    slug: string;
    parentId?: string;
  }>;
}

// Define types for structured data
export interface JSONLDStructuredData {
  '@context': string;
  '@type': string;
  headline?: string;
  description?: string;
  author?: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher?: {
    '@type': string;
    name: string;
    url?: string;
    logo?: {
      '@type': string;
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  url?: string;
  image?:
    | string
    | {
        '@type': string;
        url: string;
      };
  [key: string]: unknown;
}

// Define types for sitemap entries
export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: string;
}

// Define union types for transformable items
export type TransformableItem = HashnodePost | HashnodeSeries;

// Define union types for search results
export interface SearchResult {
  post: HashnodePost;
  searchTerm: string;
  relevance?: number;
}
