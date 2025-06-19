/**
 * Drafts Loader - Handles Hashnode draft posts (requires authentication)
 */
import { BaseHashnodeLoader } from './base.js';
import { draftSchema } from '../types/schema.js';
import type { DraftsLoaderOptions } from '../types/loader.js';
import type { HashnodePost } from '../types/hashnode.js';

/**
 * Transform Hashnode draft to Astro content format
 */
function transformHashnodeDraft(draft: HashnodePost) {
  // Generate ID for the draft
  const generateDraftId = (draft: HashnodePost): string => {
    // Try different ID fields since drafts might not have all fields
    const id = draft.id || draft.cuid || draft.slug;
    if (id) {
      return `draft-${id}`;
    }

    // Fallback: generate ID from title and updatedAt
    const title = draft.title || 'untitled';
    const updatedAt = draft.updatedAt || new Date().toISOString();
    const hash = simpleHash(`${title}-${updatedAt}`);
    return `draft-${hash}`;
  };

  // Simple hash function for generating IDs
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  return {
    // Include ID in the transformed data
    id: generateDraftId(draft),

    // Core content - handle null/undefined values
    title: draft.title || 'Untitled Draft',
    subtitle: draft.subtitle || '',
    content: draft.content?.markdown || draft.content?.html || '',
    canonicalUrl: draft.canonicalUrl || '',

    // Metadata
    updatedAt: draft.updatedAt ? new Date(draft.updatedAt) : new Date(),
    createdAt: draft.updatedAt ? new Date(draft.updatedAt) : new Date(), // Use updatedAt as fallback

    // Author information - handle potential missing author
    author: draft.author
      ? {
          id: draft.author.id || 'unknown',
          name: draft.author.name || 'Unknown Author',
          username: draft.author.username || 'unknown',
          profilePicture: draft.author.profilePicture || '',
        }
      : {
          id: 'unknown',
          name: 'Unknown Author',
          username: 'unknown',
          profilePicture: '',
        },

    // Cover image
    coverImage: draft.coverImage
      ? {
          url: draft.coverImage.url,
        }
      : undefined,

    // Tags - handle null/undefined
    tags: (draft.tags || []).map(tag => ({
      id: tag.id || 'unknown',
      name: tag.name || 'Unknown Tag',
      slug: tag.slug || 'unknown',
    })),

    // Table of contents (simplified for drafts)
    tableOfContents: [],

    // Draft-specific metadata
    isDraft: true,
    lastSaved: draft.updatedAt ? new Date(draft.updatedAt) : new Date(),

    // Raw data for advanced use cases
    raw: {
      id: draft.id || null,
      // Include any additional draft-specific fields
    },
  };
}

/**
 * Drafts Loader Class
 */
export class DraftsLoader extends BaseHashnodeLoader {
  private options: DraftsLoaderOptions;

  constructor(options: DraftsLoaderOptions) {
    // Ensure authentication token is provided
    if (!options.token) {
      throw new Error('Authentication token is required for accessing drafts');
    }

    super({
      ...options,
      collection: 'drafts',
      schema: draftSchema,
    });
    this.options = options;
  }

  /**
   * Fetch drafts data from Hashnode API
   */
  protected async fetchData(): Promise<HashnodePost[]> {
    const { maxDrafts = 50, includeDraftById } = this.options;

    // If specific draft ID is provided, fetch only that draft
    if (includeDraftById) {
      const draft = await this.client.getDraft(includeDraftById);
      return draft ? [draft] : [];
    }

    // Fetch user's drafts
    const result = await this.client.getDrafts({ first: maxDrafts });
    return result.me.drafts.edges.map(edge => edge.node);
  }

  /**
   * Transform Hashnode draft to Astro content format
   */
  protected transformItem(draft: HashnodePost) {
    return transformHashnodeDraft(draft);
  }

  /**
   * Generate ID for draft
   */
  protected generateId(draft: HashnodePost): string {
    // Try different ID fields since drafts might not have all fields
    const id = draft.id || draft.cuid || draft.slug;
    if (id) {
      return `draft-${id}`;
    }

    // Fallback: generate ID from title and updatedAt
    const fallbackId = this.generateFallbackId(draft);
    return `draft-${fallbackId}`;
  }

  /**
   * Generate fallback ID when no proper ID is available
   */
  private generateFallbackId(draft: HashnodePost): string {
    const title = draft.title || 'untitled';
    const updatedAt = draft.updatedAt || new Date().toISOString();
    const hash = this.simpleHash(`${title}-${updatedAt}`);
    return hash;
  }

  /**
   * Simple hash function for generating IDs
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
 * Create a drafts loader
 */
export function createDraftsLoader(options: DraftsLoaderOptions) {
  return new DraftsLoader(options);
}

/**
 * Create an Astro Loader for drafts
 */
export function draftsLoader(options: DraftsLoaderOptions) {
  return createDraftsLoader(options).createLoader();
}
