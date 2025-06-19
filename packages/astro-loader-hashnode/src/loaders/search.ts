/**
 * Search Loader - Handles Hashnode search functionality
 */
import {
  BaseHashnodeLoader,
  paginateResults,
  flattenPaginatedResults,
} from './base.js';
import { searchResultSchema } from '../types/schema.js';
import type { SearchLoaderOptions } from '../types/loader.js';
import type { HashnodePost } from '../types/hashnode.js';

/**
 * Transform search result to Astro content format
 */
function transformSearchResult(post: HashnodePost, searchTerm: string) {
  return {
    // Core content
    id: post.id,
    title: post.title,
    brief: post.brief || '',
    slug: post.slug,
    url: post.url,

    // Search metadata
    searchTerm,
    searchRelevance: calculateRelevance(post, searchTerm),

    // Publication date
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),

    // Stats
    reactionCount: post.reactionCount || 0,
    views: post.views || 0,

    // Author information
    author: {
      id: post.author?.id || '',
      name: post.author?.name || '',
      username: post.author?.username || '',
      profilePicture: post.author?.profilePicture || '',
    },

    // Cover image
    coverImage: post.coverImage
      ? {
          url: post.coverImage.url,
        }
      : undefined,

    // Publication info
    publication: post.publication
      ? {
          title: post.publication.title,
          url: post.publication.url,
        }
      : undefined,

    // Raw data for advanced use cases
    raw: {
      cuid: post.cuid,
    },
  };
}

/**
 * Calculate search relevance score (simple implementation)
 */
function calculateRelevance(post: HashnodePost, searchTerm: string): number {
  const term = searchTerm.toLowerCase();
  let score = 0;

  // Title match gets highest score
  if (post.title.toLowerCase().includes(term)) {
    score += 10;
  }

  // Brief/description match
  if (post.brief?.toLowerCase().includes(term)) {
    score += 5;
  }

  // Reaction count and views contribute to relevance
  score += Math.min((post.reactionCount || 0) / 10, 3);
  score += Math.min((post.views || 0) / 1000, 2);

  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

/**
 * Search Loader Class
 */
export class SearchLoader extends BaseHashnodeLoader {
  private options: SearchLoaderOptions;

  constructor(options: SearchLoaderOptions) {
    super({
      ...options,
      collection: 'search',
      schema: searchResultSchema,
    });
    this.options = options;
  }

  /**
   * Fetch search results from Hashnode API
   */
  protected async fetchData(): Promise<
    Array<{ post: HashnodePost; searchTerm: string }>
  > {
    const { searchTerms, maxResults = 50 } = this.options;

    if (!searchTerms || searchTerms.length === 0) {
      return [];
    }

    const allResults: Array<{ post: HashnodePost; searchTerm: string }> = [];

    // Search for each term
    for (const searchTerm of searchTerms) {
      try {
        const paginatedResults = paginateResults(
          async cursor => {
            const result = await this.client.searchPosts(searchTerm, {
              first: 20,
              after: cursor,
            });

            return {
              items: result.searchPostsOfPublication.edges.map(edge => ({
                post: edge.node,
                searchTerm,
              })),
              pageInfo: result.searchPostsOfPublication.pageInfo,
            };
          },
          Math.min(maxResults, 100) // Limit per search term
        );

        const results = await flattenPaginatedResults(paginatedResults);
        allResults.push(...results);
      } catch {
        // Silently continue with other search terms to avoid breaking the entire search
        // In a production environment, you might want to use a proper logging service
        // instead of console.warn
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = Array.from(
      new Map(allResults.map(result => [result.post.id, result])).values()
    ).sort((a, b) => {
      const relevanceA = calculateRelevance(a.post, a.searchTerm);
      const relevanceB = calculateRelevance(b.post, b.searchTerm);
      return relevanceB - relevanceA; // Descending order
    });

    return maxResults ? uniqueResults.slice(0, maxResults) : uniqueResults;
  }

  /**
   * Transform search result to Astro content format
   */
  protected transformItem(result: { post: HashnodePost; searchTerm: string }) {
    return transformSearchResult(result.post, result.searchTerm);
  }

  /**
   * Generate ID for search result
   */
  protected generateId(result: {
    post: HashnodePost;
    searchTerm: string;
  }): string {
    return `${result.searchTerm}-${result.post.slug || result.post.cuid || result.post.id}`;
  }
}

/**
 * Create a search loader
 */
export function createSearchLoader(options: SearchLoaderOptions) {
  return new SearchLoader(options);
}

/**
 * Create an Astro Loader for search
 */
export function searchLoader(options: SearchLoaderOptions) {
  return createSearchLoader(options).createLoader();
}
