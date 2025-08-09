/**
 * Posts Loader - Handles Hashnode blog posts
 */
import {
  BaseHashnodeLoader,
  paginateResults,
  flattenPaginatedResults,
} from './base.js';
import { postSchema } from '../types/schema.js';
import type { PostsLoaderOptions } from '../types/loader.js';
import type { HashnodePost } from '../types/hashnode.js';

/**
 * Transform Hashnode post to Astro content format
 */
function transformHashnodePost(post: HashnodePost) {
  return {
    // Core content
    id: post.id,
    cuid: post.cuid,
    title: post.title,
    subtitle: post.subtitle || '',
    brief: post.brief || '',
    slug: post.slug,
    url: post.url,
    content: {
      html: post.content?.html || '',
      markdown: post.content?.markdown || undefined,
    },

    // Metadata
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,

    // Reading metadata - match schema field names
    readingTime: post.readTimeInMinutes || 0,
    wordCount: undefined,

    // Engagement metrics - match schema field names
    views: post.views || 0,
    reactions: post.reactionCount || 0,
    comments: post.responseCount || 0,
    replies: post.replyCount || 0,

    // Status flags
    isDraft: false,
    hasLatex: post.hasLatexInPost || false,

    // Hashnode-specific required fields
    hashnodeId: post.id,
    hashnodeUrl: post.url,

    // Author information - match schema structure
    author: {
      id: post.author.id,
      name: post.author.name,
      username: post.author.username,
      profilePicture: post.author.profilePicture || undefined,
      bio: post.author.bio?.text || post.author.bio?.html || undefined,
      url: post.author.socialMediaLinks?.website || undefined,
      social: {
        website: post.author.socialMediaLinks?.website || undefined,
        github: post.author.socialMediaLinks?.github || undefined,
        twitter: post.author.socialMediaLinks?.twitter || undefined,
        linkedin: post.author.socialMediaLinks?.linkedin || undefined,
      },
      followersCount: post.author.followersCount || undefined,
    },

    // Co-authors
    coAuthors:
      post.coAuthors?.map(author => ({
        id: author.id,
        name: author.name,
        username: author.username,
        profilePicture: author.profilePicture || undefined,
        bio: author.bio?.html || undefined,
        url: undefined,
        social: undefined,
        followersCount: undefined,
      })) || undefined,

    // Visual content - match schema structure
    coverImage: post.coverImage
      ? {
          url: post.coverImage.url,
          alt: undefined,
          attribution: post.coverImage.attribution || undefined,
          isPortrait: post.coverImage.isPortrait || undefined,
          isAttributionHidden: post.coverImage.isAttributionHidden || undefined,
        }
      : undefined,

    // Taxonomies - match schema structure
    tags: (post.tags || []).map(tag => ({
      id: tag.id || undefined,
      name: tag.name,
      slug: tag.slug,
      logo: undefined,
      tagline: undefined,
      followersCount: undefined,
    })),

    // Series information
    series: post.series
      ? {
          id: post.series.id,
          name: post.series.name || undefined,
          slug: post.series.slug || undefined,
        }
      : undefined,

    // SEO data - required field
    seo: {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.brief || '',
    },

    // Open Graph data
    ogMetaData: post.ogMetaData?.image
      ? {
          image: post.ogMetaData.image,
        }
      : undefined,

    // Table of contents - match schema structure
    tableOfContents:
      post.features?.tableOfContents?.isEnabled &&
      post.features.tableOfContents.items
        ? {
            isEnabled: true,
            items: post.features.tableOfContents.items.map(item => ({
              id: item.id,
              level: item.level,
              parentId: item.parentId || undefined,
              slug: item.slug,
              title: item.title,
            })),
          }
        : undefined,

    // Comments data - match schema structure
    commentsData: post.comments
      ? {
          totalCount: post.comments.totalDocuments || 0,
          comments:
            post.comments.edges?.map(edge => ({
              id: edge.node.id,
              dateAdded: edge.node.dateAdded,
              totalReactions: edge.node.totalReactions || 0,
              content: {
                html: edge.node.content?.html || '',
                markdown: edge.node.content?.markdown || undefined,
              },
              author: {
                id: edge.node.author.id,
                name: edge.node.author.name,
                username: edge.node.author.username,
                profilePicture: edge.node.author.profilePicture || undefined,
                bio: undefined,
                url: undefined,
                social: undefined,
                followersCount: undefined,
              },
              replies:
                edge.node.replies?.edges?.map(reply => reply.node) || undefined,
            })) || [],
        }
      : undefined,

    // Preferences
    preferences: {
      disableComments: post.preferences?.disableComments || undefined,
      stickCoverToBottom: post.preferences?.stickCoverToBottom || undefined,
      pinnedToBlog:
        (
          post.preferences as HashnodePost['preferences'] & {
            pinnedToBlog?: boolean;
          }
        )?.pinnedToBlog || undefined,
      isDelisted:
        (
          post.preferences as HashnodePost['preferences'] & {
            isDelisted?: boolean;
          }
        )?.isDelisted || undefined,
    },

    // Publication info - not included in transformation for now
    publication: undefined,
  };
}

/**
 * Posts Loader Class
 */
export class PostsLoader extends BaseHashnodeLoader {
  private options: PostsLoaderOptions;

  constructor(options: PostsLoaderOptions) {
    super({
      ...options,
      collection: 'posts',
      schema: postSchema,
    });
    this.options = options;
  }

  /**
   * Fetch posts data from Hashnode API
   */
  protected async fetchData(): Promise<HashnodePost[]> {
    const {
      maxPosts,
      includeDrafts = false,
      includeComments = false,
      includeCoAuthors = false,
      includeTableOfContents = false,
      filterByTags,
    } = this.options;

    // Handle drafts (requires authentication)
    if (includeDrafts) {
      if (!this.config.token) {
        throw new Error('Authentication token required for accessing drafts');
      }

      const drafts = await this.client.getDrafts({ first: maxPosts });
      return drafts.me.drafts.edges.map(edge => edge.node);
    }

    // Handle tag filtering
    if (filterByTags && filterByTags.length > 0) {
      const allPosts: HashnodePost[] = [];

      for (const tagSlug of filterByTags) {
        const paginatedPosts = paginateResults(async cursor => {
          const result = await this.client.getPostsByTag(tagSlug, {
            first: 20,
            after: cursor,
          });

          return {
            items: result.publication.posts.edges.map(edge => edge.node),
            pageInfo: result.publication.posts.pageInfo,
          };
        }, maxPosts);

        const posts = await flattenPaginatedResults(paginatedPosts);
        allPosts.push(...posts);
      }

      // Remove duplicates and sort by published date
      const uniquePosts = Array.from(
        new Map(allPosts.map(post => [post.id, post])).values()
      ).sort(
        (a, b) =>
          new Date(b.publishedAt || 0).getTime() -
          new Date(a.publishedAt || 0).getTime()
      );

      return maxPosts ? uniquePosts.slice(0, maxPosts) : uniquePosts;
    }

    // Default: fetch all posts with pagination
    const paginatedPosts = paginateResults(async cursor => {
      const result = await this.client.getPosts({
        first: 20,
        after: cursor,
        includeComments,
        includeCoAuthors,
        includeTableOfContents,
      });

      return {
        items: result.publication.posts.edges.map(edge => edge.node),
        pageInfo: result.publication.posts.pageInfo,
      };
    }, maxPosts);

    return flattenPaginatedResults(paginatedPosts);
  }

  /**
   * Transform Hashnode post to Astro content format
   */
  protected transformItem(post: HashnodePost) {
    return transformHashnodePost(post);
  }

  /**
   * Generate ID for post (prefer slug over cuid over id)
   */
  protected generateId(post: HashnodePost): string {
    return post.slug || post.cuid || post.id;
  }
}

/**
 * Create a posts loader
 */
export function createPostsLoader(options: PostsLoaderOptions) {
  return new PostsLoader(options);
}

/**
 * Create an Astro Loader for posts
 */
export function postsLoader(options: PostsLoaderOptions) {
  return createPostsLoader(options).createLoader();
}
