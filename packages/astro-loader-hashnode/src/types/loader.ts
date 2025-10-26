/**
 * Loader configuration types
 */

/**
 * Context provided to image transformation function
 */
export interface ImageTransformContext {
  /** Type of image: cover or inline */
  type: 'cover' | 'inline';
  /** Post ID */
  postId: string;
  /** Post title */
  postTitle: string;
  /** Original Hashnode CDN URL */
  originalUrl: string;
}

/**
 * Image transformation function type
 */
export type ImageTransformFn = (
  url: string,
  context: ImageTransformContext
) => string | Promise<string>;

export interface BaseLoaderOptions {
  /** The Hashnode publication host (e.g., 'yourblog.hashnode.dev') */
  publicationHost: string;
  /** Optional API token for accessing private content */
  token?: string;
  /** Custom GraphQL endpoint (default: 'https://gql.hashnode.com/') */
  apiEndpoint?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Cache duration in milliseconds (default: 1 hour) */
  cacheDuration?: number;
  /** Enable request caching */
  cache?: boolean;
  /** Custom cache TTL in seconds */
  cacheTTL?: number;
  /**
   * Transform image URLs during content loading
   *
   * @param url - Original Hashnode CDN URL
   * @param context - Metadata about the image
   * @returns Transformed URL (can be async)
   *
   * @example
   * ```typescript
   * transformImage: (url) => `https://my-cdn.com/${url}`
   * ```
   *
   * @example Using mapping file
   * ```typescript
   * const urlMap = new Map(mapping.map(m => [m.hashnodeUrl, m.cloudflareUrl]));
   * transformImage: (url) => urlMap.get(url) || url
   * ```
   */
  transformImage?: ImageTransformFn;
}

export interface PostsLoaderOptions extends BaseLoaderOptions {
  /** Maximum number of posts to fetch (default: 1000) */
  maxPosts?: number;
  /** Whether to include draft posts (requires token) */
  includeDrafts?: boolean;
  /** Filter posts by tags (array of tag slugs) */
  filterByTags?: string[];
  /** Minimum reading time in minutes */
  minReadingTime?: number;
  /** Maximum reading time in minutes */
  maxReadingTime?: number;
  /** Only include posts published after this date */
  publishedAfter?: Date;
  /** Only include posts published before this date */
  publishedBefore?: Date;
  /** Include comments data for posts */
  includeComments?: boolean;
  /** Maximum number of comments to fetch per post (default: 25) */
  maxCommentsPerPost?: number;
  /** Include table of contents data */
  includeTableOfContents?: boolean;
  /** Include co-authors information */
  includeCoAuthors?: boolean;
  /** Include publication metadata and settings */
  includePublicationMeta?: boolean;
  /** Include engagement metrics (views, reactions, comments count) */
  includeEngagementMetrics?: boolean;
}

export interface SeriesLoaderOptions extends BaseLoaderOptions {
  /** Series slug to load */
  seriesSlug?: string;
  /** Maximum number of posts to fetch from series */
  maxPostsPerSeries?: number;
  /** Include posts in series data */
  includePosts?: boolean;
}

export interface StaticPagesLoaderOptions extends BaseLoaderOptions {
  /** Maximum number of static pages to fetch */
  maxPages?: number;
}

export interface TagsLoaderOptions extends BaseLoaderOptions {
  /** Specific tag slugs to load */
  tagSlugs: string[];
  /** Maximum number of posts to fetch per tag */
  maxPostsPerTag?: number;
}

export interface SearchLoaderOptions extends BaseLoaderOptions {
  /** Search query string */
  query?: string;
  /** Search terms array */
  searchTerms?: string[];
  /** Maximum search results */
  maxResults?: number;
}

export interface NewsletterLoaderOptions extends BaseLoaderOptions {
  /** Include subscription data */
  includeSubscriptionData?: boolean;
}

export interface DraftsLoaderOptions extends BaseLoaderOptions {
  /** Specific draft ID to load */
  draftId?: string;
  /** Include specific draft by ID */
  includeDraftById?: string;
  /** Maximum number of drafts to fetch */
  maxDrafts?: number;
}

export interface FilterOptions {
  /** Filter by tags */
  tags?: string[];
  /** Filter by reading time range */
  readingTime?: {
    min?: number;
    max?: number;
  };
  /** Filter by date range */
  dateRange?: {
    after?: Date;
    before?: Date;
  };
  /** Filter by series */
  seriesSlug?: string;
  /** Filter by author */
  authorUsername?: string;
}

export interface CacheOptions {
  /** Cache duration in milliseconds */
  duration?: number;
  /** Enable/disable caching */
  enabled?: boolean;
  /** Cache key prefix */
  keyPrefix?: string;
}

export interface ApiOptions {
  /** API endpoint URL */
  endpoint?: string;
  /** Request timeout */
  timeout?: number;
  /** Authentication token */
  token?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Rate limiting options */
  rateLimit?: {
    maxRetries?: number;
    retryDelay?: number;
  };
}
