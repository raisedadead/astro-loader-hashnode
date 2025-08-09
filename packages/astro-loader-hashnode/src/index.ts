/**
 * Astro Loader for Hashnode - Clean, modular API
 *
 * This package provides Astro content loaders for Hashnode blog content.
 * It offers a clean wrapper around the Hashnode GraphQL API with built-in
 * caching, type safety, and utilities for content transformation.
 *
 * @example Basic usage:
 * ```typescript
 * import { hashnodeLoader } from 'astro-loader-hashnode';
 *
 * export const collections = {
 *   blog: defineCollection({
 *     loader: hashnodeLoader({
 *       publicationHost: 'blog.example.com'
 *     })
 *   })
 * };
 * ```
 *
 * @example Advanced usage with multiple loaders:
 * ```typescript
 * import { postsLoader, seriesLoader, createHashnodeClient } from 'astro-loader-hashnode';
 *
 * export const collections = {
 *   posts: defineCollection({
 *     loader: postsLoader({
 *       publicationHost: 'blog.example.com',
 *       maxPosts: 100,
 *       includeComments: true
 *     })
 *   }),
 *   series: defineCollection({
 *     loader: seriesLoader({
 *       publicationHost: 'blog.example.com',
 *       includePosts: true
 *     })
 *   })
 * };
 * ```
 */

// Import the loader functions for internal use
import {
  postsLoader,
  seriesLoader,
  searchLoader,
  draftsLoader,
} from './loaders/index.js';

// Main loader functions (recommended for most users)
export {
  postsLoader,
  seriesLoader,
  searchLoader,
  draftsLoader,
} from './loaders/index.js';

// Loader classes for advanced usage
export {
  PostsLoader,
  SeriesLoader,
  SearchLoader,
  DraftsLoader,
  BaseHashnodeLoader,
  createLoader,
} from './loaders/index.js';

// API client for custom implementations
export { HashnodeClient, createHashnodeClient } from './api/client.js';
export type {
  HashnodeClientOptions,
  GraphQLResponse,
  PostsResponse,
  SeriesResponse,
  SearchResponse,
} from './api/client.js';

// Type definitions
export type {
  // Core Hashnode types
  HashnodePost,
  HashnodeAuthor,
  HashnodeSeries,
  HashnodePublication,
  HashnodeTag,
  HashnodeComment,
  HashnodeStaticPage,

  // Transformed content types
  TransformedPost,
  TransformedSeries,
  TransformedSearch,
  TransformedDraft,

  // Table of contents
  TableOfContentsItem,
} from './types/hashnode.js';

export type {
  // Loader configuration types
  BaseLoaderOptions,
  PostsLoaderOptions,
  SeriesLoaderOptions,
  SearchLoaderOptions,
  DraftsLoaderOptions,
} from './types/loader.js';

export type {
  // Schema types for validation
  PostData,
  SeriesData,
  SearchResultData,
  DraftData,
} from './types/schema.js';

// Utility functions for content processing
export {
  // Content utilities
  extractTextFromHtml,
  generateExcerpt,
  calculateReadingTime,
  countWords,
  normalizeContent,
  extractHeadings,
  generateTableOfContents,
  processContent,

  // SEO utilities
  generateSEOMetadata,
  optimizeTitle,
  generateMetaDescription,
  generateKeywords,
  generateJSONLD,
  validateSEOMetadata,

  // Date utilities
  formatDate,
  timeAgo,
  isRecent,

  // URL utilities
  createSlug,
  normalizeUrl,
  extractDomain,
  isValidUrl,
  makeAbsoluteUrl,
  buildUrl,
  parseUrl,
  cleanUrl,
  generateSharingUrls,
  generateCanonicalUrl,
  extractSlugFromUrl,
  isSameDomain,
  generateSitemapEntry,

  // Combined utilities
  processPostData,
} from './utils/index.js';

export type { SEOMetadata } from './utils/index.js';

// Main loader function (backwards compatibility and simple usage)
/**
 * Create a Hashnode posts loader (primary entry point)
 *
 * This is the main function most users should use. It creates a loader
 * that fetches blog posts from a Hashnode publication.
 *
 * @param options - Configuration options for the loader
 * @returns Astro Loader instance
 *
 * @example
 * ```typescript
 * import { hashnodeLoader } from 'astro-loader-hashnode';
 *
 * export const collections = {
 *   blog: defineCollection({
 *     loader: hashnodeLoader({
 *       publicationHost: 'blog.example.com',
 *       maxPosts: 100,
 *       includeComments: true,
 *       includeCoAuthors: true
 *     })
 *   })
 * };
 * ```
 */
export function hashnodeLoader(
  options: import('./types/loader.js').PostsLoaderOptions
) {
  return postsLoader(options);
}

// Convenience factory functions for common use cases
/**
 * Create multiple loaders for a complete Hashnode setup
 *
 * @param baseOptions - Base configuration options
 * @returns Object with multiple pre-configured loaders
 *
 * @example
 * ```typescript
 * import { createHashnodeLoaders } from 'astro-loader-hashnode';
 *
 * const { posts, series, drafts } = createHashnodeLoaders({
 *   publicationHost: 'blog.example.com',
 *   token: process.env.HASHNODE_TOKEN
 * });
 *
 * export const collections = {
 *   posts: defineCollection({ loader: posts }),
 *   series: defineCollection({ loader: series }),
 *   drafts: defineCollection({ loader: drafts })
 * };
 * ```
 */
export function createHashnodeLoaders(
  baseOptions: import('./types/loader.js').BaseLoaderOptions
) {
  return {
    posts: postsLoader(baseOptions),
    series: seriesLoader(baseOptions),
    drafts: baseOptions.token
      ? draftsLoader({
          ...baseOptions,
          token: baseOptions.token,
        })
      : undefined,
    search: (searchTerms: string[]) =>
      searchLoader({
        ...baseOptions,
        searchTerms,
      }),
  };
}

/**
 * Create a simple blog setup with just posts
 *
 * @param options - Posts loader options
 * @returns Object with posts loader
 *
 * @example
 * ```typescript
 * import { createBlog } from 'astro-loader-hashnode';
 *
 * export const collections = createBlog({
 *   publicationHost: 'blog.example.com'
 * });
 * ```
 */
export function createBlog(
  options: import('./types/loader.js').PostsLoaderOptions
) {
  return {
    posts: defineCollection({
      loader: postsLoader(options),
    }),
  };
}

/**
 * Create a complete publication setup with all content types
 *
 * @param options - Base loader options
 * @returns Object with all available loaders
 *
 * @example
 * ```typescript
 * import { createPublication } from 'astro-loader-hashnode';
 *
 * export const collections = createPublication({
 *   publicationHost: 'blog.example.com',
 *   token: process.env.HASHNODE_TOKEN,
 *   maxPosts: 200
 * });
 * ```
 */
export function createPublication(
  baseOptions: import('./types/loader.js').BaseLoaderOptions
) {
  const collections: Record<
    string,
    { loader: import('astro/loaders').Loader }
  > = {
    posts: defineCollection({
      loader: postsLoader(baseOptions),
    }),

    series: defineCollection({
      loader: seriesLoader({
        ...baseOptions,
        includePosts: true,
      }),
    }),
  };

  // Add drafts if token is provided
  if (baseOptions.token) {
    collections.drafts = defineCollection({
      loader: draftsLoader({
        ...baseOptions,
        token: baseOptions.token,
      }),
    });
  }

  return collections;
}

// Helper function for defineCollection (imported dynamically to avoid circular deps)
function defineCollection(config: { loader: import('astro/loaders').Loader }) {
  return config;
}

// Package name (kept for diagnostics)
export const packageName = 'astro-loader-hashnode';

/**
 * Check if the loader is compatible with the current Astro version
 *
 * @returns boolean indicating compatibility
 */
export async function checkCompatibility(): Promise<boolean> {
  try {
    // Try to import Astro loader types to check compatibility
    await import('astro/loaders');
    return true;
  } catch {
    return false;
  }
}

// Default export for convenience
export default hashnodeLoader;
