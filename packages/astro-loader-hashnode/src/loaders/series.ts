/**
 * Series Loader - Handles Hashnode series
 */
import { BaseHashnodeLoader } from './base.js';
import { seriesSchema } from '../types/schema.js';
import type { SeriesLoaderOptions } from '../types/loader.js';
import type { HashnodeSeries } from '../types/hashnode.js';

/**
 * Transform Hashnode series to Astro content format
 */
function transformHashnodeSeries(series: HashnodeSeries) {
  return {
    // Core content
    name: series.name,
    slug: series.slug,
    description: series.description?.html || series.description?.text || '',

    // Metadata
    createdAt: series.createdAt ? new Date(series.createdAt) : new Date(),
    updatedAt: series.updatedAt ? new Date(series.updatedAt) : new Date(),

    // Cover image
    coverImage: series.coverImage
      ? {
          url: series.coverImage,
        }
      : undefined,

    // SEO data
    seo: series.seo
      ? {
          title: series.seo.title || series.name,
          description: series.seo.description || series.description?.text || '',
        }
      : {
          title: series.name,
          description: series.description?.text || '',
        },

    // Author information
    author: series.author
      ? {
          id: series.author.id,
          name: series.author.name,
          username: series.author.username,
          profilePicture: series.author.profilePicture || '',
          bio: series.author.bio?.text || series.author.bio?.html || '',
          followersCount: series.author.followersCount || 0,
        }
      : undefined,

    // Posts in series (if included)
    posts: series.posts
      ? series.posts.edges?.map(edge => ({
          id: edge.node.id,
          title: edge.node.title,
          slug: edge.node.slug,
          brief: edge.node.brief || '',
          publishedAt: edge.node.publishedAt
            ? new Date(edge.node.publishedAt)
            : new Date(),
          readTimeInMinutes: edge.node.readTimeInMinutes || 0,
          views: edge.node.views || 0,
          url: edge.node.url,
          coverImage: edge.node.coverImage
            ? {
                url: edge.node.coverImage.url,
                isPortrait: edge.node.coverImage.isPortrait || false,
              }
            : undefined,
          author: {
            name: edge.node.author.name,
            username: edge.node.author.username,
            profilePicture: edge.node.author.profilePicture || '',
          },
        })) || []
      : [],

    // Sort order for series posts
    sortOrder: series.sortOrder || 'asc',

    // Raw data for advanced use cases
    raw: {
      id: series.id,
      cuid: series.cuid,
    },
  };
}

/**
 * Series Loader Class
 */
export class SeriesLoader extends BaseHashnodeLoader {
  private options: SeriesLoaderOptions;

  constructor(options: SeriesLoaderOptions) {
    super({
      ...options,
      collection: 'series',
      schema: seriesSchema,
    });
    this.options = options;
  }

  /**
   * Fetch series data from Hashnode API
   */
  protected async fetchData(): Promise<HashnodeSeries[]> {
    const { includePosts = false } = this.options;

    // Note: Hashnode API doesn't have a direct "get all series" endpoint
    // This is a simplified approach - in practice, you might need to:
    // 1. Get posts and extract unique series
    // 2. Use publication-specific series endpoints
    // 3. Or implement custom GraphQL queries

    const query = `
      query GetSeries($host: String!) {
        publication(host: $host) {
          id
          series(first: 50) {
            edges {
              node {
                id
                cuid
                name
                slug
                description {
                  html
                  text
                }
                coverImage
                createdAt
                sortOrder
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
                ${
                  includePosts
                    ? `
                posts(first: 100) {
                  edges {
                    node {
                      id
                      title
                      slug
                      brief
                      publishedAt
                      readTimeInMinutes
                      views
                      url
                      coverImage {
                        url
                        isPortrait
                      }
                      author {
                        name
                        username
                        profilePicture
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
        }
      }
    `;

    const result = await this.client.query<{
      publication: {
        series: {
          edges: Array<{ node: HashnodeSeries }>;
        };
      };
    }>(query, {
      host: this.config.publicationHost,
    });

    return result.publication.series.edges.map(edge => edge.node);
  }

  /**
   * Transform Hashnode series to Astro content format
   */
  protected transformItem(series: HashnodeSeries) {
    return transformHashnodeSeries(series);
  }

  /**
   * Generate ID for series (prefer slug over cuid over id)
   */
  protected generateId(series: HashnodeSeries): string {
    return series.slug || series.cuid || series.id;
  }
}

/**
 * Create a series loader
 */
export function createSeriesLoader(options: SeriesLoaderOptions) {
  return new SeriesLoader(options);
}

/**
 * Create an Astro Loader for series
 */
export function seriesLoader(options: SeriesLoaderOptions) {
  return createSeriesLoader(options).createLoader();
}
