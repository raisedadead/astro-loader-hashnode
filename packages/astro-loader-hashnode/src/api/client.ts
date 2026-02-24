/**
 * Hashnode API Client - Clean wrapper around Hashnode GraphQL API
 */
import type {
  HashnodePost,
  HashnodeSeries,
  HashnodePublication,
} from '../types/hashnode.js';
import {
  buildDynamicPostsQuery,
  searchPostsQuery,
  getUserDraftsQuery,
  getDraftByIdQuery,
} from '../queries/index.js';

export interface HashnodeClientOptions {
  /**
   * Hashnode publication host (e.g., 'blog.example.com')
   */
  publicationHost: string;

  /**
   * Optional API token for private content access
   */
  token?: string;

  /**
   * Custom GraphQL endpoint (defaults to Hashnode's public API)
   */
  endpoint?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable request caching
   */
  cache?: boolean;

  /**
   * Custom cache TTL in seconds
   */
  cacheTTL?: number;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

export interface PaginationInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface PostsResponse {
  publication: {
    id: string;
    title: string;
    url: string;
    posts: {
      pageInfo: PaginationInfo;
      edges: Array<{
        node: HashnodePost;
        cursor?: string;
      }>;
    };
  };
}

export interface SeriesResponse {
  publication: {
    id: string;
    series: {
      pageInfo: PaginationInfo;
      edges: Array<{
        node: HashnodeSeries;
      }>;
    };
  };
}

export interface SearchResponse {
  searchPostsOfPublication: {
    edges: Array<{
      cursor: string;
      node: HashnodePost;
    }>;
    pageInfo: PaginationInfo;
  };
}

/**
 * Simple in-memory cache for GraphQL requests
 */
class RequestCache {
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Hashnode API Client
 *
 * Provides a clean, typed wrapper around the Hashnode GraphQL API
 */
export class HashnodeClient {
  private readonly endpoint: string;
  private readonly publicationHost: string;
  private readonly token?: string;
  private readonly timeout: number;
  private readonly cache?: RequestCache;
  private readonly cacheTTL: number;

  constructor(options: HashnodeClientOptions) {
    this.endpoint = options.endpoint || 'https://gql.hashnode.com/';
    this.publicationHost = options.publicationHost;
    this.token = options.token;
    this.timeout = options.timeout || 30000;
    this.cacheTTL = options.cacheTTL || 300; // 5 minutes default

    if (options.cache !== false) {
      this.cache = new RequestCache();
    }
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const cacheKey = this.cache ? this.getCacheKey(query, variables) : null;

    // Check cache first
    if (cacheKey && this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'astro-loader-hashnode',
    };

    // Add authorization header if token is provided
    if (this.token) {
      headers['Authorization'] = this.token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(err => err.message).join(', ');
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      // Cache successful results
      if (cacheKey && this.cache) {
        this.cache.set(cacheKey, result.data, this.cacheTTL);
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`, {
          cause: error,
        });
      }

      throw error;
    }
  }

  /**
   * Get posts from the publication
   */
  async getPosts(
    options: {
      first?: number;
      after?: string;
      includeComments?: boolean;
      includeCoAuthors?: boolean;
      includeTableOfContents?: boolean;
    } = {}
  ): Promise<PostsResponse> {
    const {
      first = 20,
      after,
      includeComments = false,
      includeCoAuthors = false,
      includeTableOfContents = false,
    } = options;

    const query = buildDynamicPostsQuery({
      includeComments,
      includeCoAuthors,
      includeTableOfContents,
      includePublicationMeta: false,
    });

    return this.query<PostsResponse>(query, {
      host: this.publicationHost,
      first,
      after,
    });
  }

  /**
   * Get a single post by slug
   */
  async getPost(
    slug: string,
    options: {
      includeComments?: boolean;
      includeCoAuthors?: boolean;
    } = {}
  ): Promise<HashnodePost | null> {
    const query = `
      query GetSinglePost($host: String!, $slug: String!) {
        publication(host: $host) {
          post(slug: $slug) {
            id
            cuid
            title
            subtitle
            brief
            slug
            url
            content {
              html
              markdown
            }
            coverImage {
              url
              attribution
              isPortrait
              isAttributionHidden
            }
            publishedAt
            updatedAt
            readTimeInMinutes
            views
            reactionCount
            responseCount
            replyCount
            hasLatexInPost
            author {
              id
              name
              username
              profilePicture
              bio {
                html
                text
              }
              socialMediaLinks {
                website
                github
                twitter
                linkedin
              }
              followersCount
            }
            tags {
              id
              name
              slug
            }
            seo {
              title
              description
            }
            ogMetaData {
              image
            }
            series {
              id
              name
              slug
            }
            preferences {
              disableComments
              stickCoverToBottom
            }
            ${
              options.includeCoAuthors
                ? `
            coAuthors {
              id
              name
              username
              profilePicture
              bio {
                html
              }
            }
            `
                : ''
            }
            ${
              options.includeComments
                ? `
            comments(first: 25) {
              totalDocuments
              edges {
                node {
                  id
                  dateAdded
                  totalReactions
                  content {
                    html
                    markdown
                  }
                  author {
                    id
                    name
                    username
                    profilePicture
                  }
                  replies(first: 10) {
                    edges {
                      node {
                        id
                        dateAdded
                        content {
                          html
                          markdown
                        }
                        author {
                          id
                          name
                          username
                          profilePicture
                        }
                      }
                    }
                  }
                }
              }
            }
            `
                : ''
            }
          }
        }
      }
    `;

    const result = await this.query<{
      publication: { post: HashnodePost | null };
    }>(query, {
      host: this.publicationHost,
      slug,
    });

    return result.publication.post;
  }

  /**
   * Search posts in the publication
   */
  async searchPosts(
    searchTerm: string,
    options: {
      first?: number;
      after?: string;
    } = {}
  ): Promise<SearchResponse> {
    const { first = 20, after } = options;

    const query = searchPostsQuery();

    return this.query<SearchResponse>(query, {
      first,
      after,
      filter: {
        query: searchTerm,
        publicationId: this.publicationHost,
      },
    });
  }

  /**
   * Get publication information
   */
  async getPublication(): Promise<HashnodePublication> {
    const query = `
      query GetPublication($host: String!) {
        publication(host: $host) {
          id
          title
          displayTitle
          url
          urlPattern
          about {
            html
            text
          }
          author {
            id
            name
            username
            profilePicture
            bio {
              html
              text
            }
            socialMediaLinks {
              website
              github
              twitter
              linkedin
            }
            followersCount
          }
          favicon
          headerColor
          metaTags
          descriptionSEO
          isTeam
          followersCount
          preferences {
            layout
            logo
            disableFooterBranding
            enabledPages {
              newsletter
              members
            }
            darkMode {
              enabled
              logo
            }
          }
          features {
            newsletter {
              isEnabled
            }
            readTime {
              isEnabled
            }
            textSelectionSharer {
              isEnabled
            }
            audioBlog {
              isEnabled
              voiceType
            }
            customCSS {
              isEnabled
            }
          }
          links {
            twitter
            instagram
            github
            website
            hashnode
            youtube
            linkedin
            mastodon
          }
          integrations {
            umamiWebsiteUUID
            gaTrackingID
            fbPixelID
            hotjarSiteID
            matomoURL
            matomoSiteID
            fathomSiteID
            gTagManagerID
            fathomCustomDomain
            fathomCustomDomainEnabled
            plausibleAnalyticsEnabled
            koalaPublicKey
            msClarityID
          }
          ogMetaData {
            image
          }
        }
      }
    `;

    const result = await this.query<{ publication: HashnodePublication }>(
      query,
      {
        host: this.publicationHost,
      }
    );

    return result.publication;
  }

  /**
   * Get posts by tag
   */
  async getPostsByTag(
    tagSlug: string,
    options: {
      first?: number;
      after?: string;
    } = {}
  ): Promise<PostsResponse> {
    const { first = 20, after } = options;

    const query = `
      query GetPostsByTag($host: String!, $tagSlug: String!, $first: Int!, $after: String) {
        publication(host: $host) {
          id
          title
          url
          posts(first: $first, after: $after, filter: { tagSlugs: [$tagSlug] }) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                cuid
                title
                subtitle
                brief
                slug
                url
                content {
                  html
                }
                coverImage {
                  url
                  attribution
                  isPortrait
                  isAttributionHidden
                }
                publishedAt
                updatedAt
                readTimeInMinutes
                views
                reactionCount
                responseCount
                replyCount
                author {
                  id
                  name
                  username
                  profilePicture
                  bio {
                    html
                    text
                  }
                  followersCount
                }
                tags {
                  id
                  name
                  slug
                }
                seo {
                  title
                  description
                }
                ogMetaData {
                  image
                }
                series {
                  id
                  name
                  slug
                }
              }
              cursor
            }
          }
        }
      }
    `;

    return this.query<PostsResponse>(query, {
      host: this.publicationHost,
      tagSlug,
      first,
      after,
    });
  }

  /**
   * Get draft posts (requires authentication)
   */
  async getDrafts(
    options: {
      first?: number;
    } = {}
  ): Promise<{ me: { drafts: { edges: Array<{ node: HashnodePost }> } } }> {
    if (!this.token) {
      throw new Error('Authentication token required for accessing drafts');
    }

    const { first = 20 } = options;

    const query = getUserDraftsQuery();

    return this.query(query, { first });
  }

  /**
   * Get a specific draft by ID (requires authentication)
   */
  async getDraft(id: string): Promise<HashnodePost | null> {
    if (!this.token) {
      throw new Error('Authentication token required for accessing drafts');
    }

    const query = getDraftByIdQuery();

    const result = await this.query<{ draft: HashnodePost | null }>(query, {
      id,
    });
    return result.draft;
  }

  /**
   * Clear the request cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(
    query: string,
    variables: Record<string, unknown>
  ): string {
    const hash = this.simpleHash(query + JSON.stringify(variables));
    return `${this.publicationHost}:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Create a new Hashnode API client
 */
export function createHashnodeClient(
  options: HashnodeClientOptions
): HashnodeClient {
  return new HashnodeClient(options);
}
