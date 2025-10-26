/**
 * Base Loader Class - Common functionality for all Hashnode loaders
 */
import type { Loader, LoaderContext } from 'astro/loaders';
import { z } from 'zod';
import {
  createHashnodeClient,
  type HashnodeClient,
  type HashnodeClientOptions,
} from '../api/client.js';
import type { BaseLoaderOptions } from '../types/loader.js';

/**
 * Digest calculation for content changes
 */
export function calculateDigest(content: unknown): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Enhanced error class for loader operations
 */
export class LoaderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoaderError';
  }
}

/**
 * Result type for loader operations
 */
export interface LoaderResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: LoaderError;
  cached?: boolean;
}

/**
 * Configuration for base loader
 */
export interface BaseLoaderConfig extends BaseLoaderOptions {
  /**
   * Collection name in Astro
   */
  collection: string;

  /**
   * Zod schema for validation
   */
  schema: z.ZodSchema;
}

/**
 * Abstract base class for all Hashnode loaders
 *
 * Provides common functionality like:
 * - Client initialization
 * - Error handling
 * - Caching with digests
 * - Data validation
 * - Astro loader interface
 */
export abstract class BaseHashnodeLoader {
  protected client: HashnodeClient;
  protected config: BaseLoaderConfig;

  constructor(config: BaseLoaderConfig) {
    this.config = config;

    // Create Hashnode client with user options
    const clientOptions: HashnodeClientOptions = {
      publicationHost: config.publicationHost,
      token: config.token,
      timeout: config.timeout,
      cache: config.cache !== false,
      cacheTTL: config.cacheTTL,
    };

    this.client = createHashnodeClient(clientOptions);
  }

  /**
   * Abstract method to fetch data from Hashnode API
   * Must be implemented by specific loaders
   */
  protected abstract fetchData(): Promise<unknown[]>;

  /**
   * Abstract method to transform API data to Astro content format
   * Must be implemented by specific loaders
   */
  protected abstract transformItem(item: unknown): unknown;

  /**
   * Generate unique ID for an item
   * Can be overridden by specific loaders
   */
  protected generateId(item: unknown): string {
    const obj = item as Record<string, unknown>;
    return (obj.id as string) || (obj.cuid as string) || (obj.slug as string);
  }

  /**
   * Validate transformed data against schema
   */
  protected validateData(data: unknown): LoaderResult {
    try {
      const validatedData = this.config.schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      const zodError = error as z.ZodError;
      return {
        success: false,
        error: new LoaderError(
          `Data validation failed: ${zodError.message}`,
          'VALIDATION_ERROR',
          { errors: zodError.issues }
        ),
      };
    }
  }

  /**
   * Safe data fetching with error handling
   */
  protected async safeFetch(): Promise<LoaderResult<unknown[]>> {
    try {
      const data = await this.fetchData();
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: new LoaderError(
          `Failed to fetch data: ${message}`,
          'FETCH_ERROR',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Process a single item with validation and transformation
   */
  protected async processItem(item: unknown): Promise<LoaderResult> {
    try {
      // Transform the item
      const transformed = this.transformItem(item);

      // Validate against schema
      const validation = this.validateData(transformed);
      if (!validation.success) {
        return validation;
      }

      return {
        success: true,
        data: {
          id: this.generateId(item),
          ...(validation.data as Record<string, unknown>),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: new LoaderError(
          `Failed to process item: ${message}`,
          'PROCESS_ERROR',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Main load method - implements Astro Loader interface
   */
  async load(context: LoaderContext): Promise<void> {
    const { store, logger, parseData, generateDigest } =
      context as LoaderContext & {
        generateDigest?: (obj: unknown) => string;
      };

    logger.info(`Loading ${this.config.collection} from Hashnode...`);

    try {
      // Fetch data from API
      const fetchResult = await this.safeFetch();
      if (!fetchResult.success) {
        logger.error(
          `Failed to fetch ${this.config.collection}: ${fetchResult.error?.message}`
        );
        return;
      }

      const items = fetchResult.data || [];
      logger.info(`Fetched ${items.length} items from Hashnode`);

      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Process each item
      for (const item of items) {
        const result = await this.processItem(item);

        if (!result.success) {
          logger.warn(`Skipping item due to error: ${result.error?.message}`);
          errorCount++;
          continue;
        }

        const processedItem = result.data as Record<string, unknown>;
        const itemId = processedItem.id as string;

        // Calculate content digest for change detection
        // Prefer Astro provided generateDigest if available for consistency
        const digest = generateDigest
          ? generateDigest(processedItem)
          : calculateDigest(processedItem);

        interface MaybeContent {
          content?: { html?: string };
        }
        const processedWithContent = processedItem as MaybeContent;
        const stored = store.set({
          id: itemId,
          data: await parseData({
            id: itemId,
            data: processedItem,
          }),
          digest,
          // Provide rendered HTML so users can leverage render(entry)
          rendered: {
            html: processedWithContent.content?.html || '',
            metadata: {},
          },
        });
        if (stored) {
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      logger.info(
        `${this.config.collection} loading complete: ` +
          `${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Fatal error loading ${this.config.collection}: ${message}`);
      throw new LoaderError(`Loader failed: ${message}`, 'LOADER_ERROR', {
        originalError: error,
      });
    }
  }

  /**
   * Create an Astro Loader from this instance
   */
  createLoader(): Loader {
    return {
      name: `hashnode-${this.config.collection}`,
      // Expose internal schema so users get types if they don't provide one; user schema will override.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: () => this.config.schema as any,
      load: (context: LoaderContext) => this.load(context),
    };
  }

  /**
   * Get client instance (for advanced usage)
   */
  getClient(): HashnodeClient {
    return this.client;
  }

  /**
   * Clear client cache
   */
  clearCache(): void {
    this.client.clearCache();
  }
}

/**
 * Utility function to create pagination handler
 */
export async function* paginateResults<T>(
  fetchPage: (cursor?: string) => Promise<{
    items: T[];
    pageInfo: { hasNextPage: boolean; endCursor?: string };
  }>,
  maxItems?: number
): AsyncGenerator<T[], void, undefined> {
  let cursor: string | undefined;
  let totalFetched = 0;

  do {
    const result = await fetchPage(cursor);
    const { items, pageInfo } = result;

    if (items.length === 0) break;

    // Apply maxItems limit if specified
    let itemsToYield = items;
    if (maxItems && totalFetched + items.length > maxItems) {
      itemsToYield = items.slice(0, maxItems - totalFetched);
    }

    yield itemsToYield;
    totalFetched += itemsToYield.length;

    // Check if we should continue
    if (!pageInfo.hasNextPage || (maxItems && totalFetched >= maxItems)) {
      break;
    }

    cursor = pageInfo.endCursor;
  } while (true);
}

/**
 * Utility function to flatten paginated results
 */
export async function flattenPaginatedResults<T>(
  paginatedGenerator: AsyncGenerator<T[], void, undefined>
): Promise<T[]> {
  const allItems: T[] = [];

  for await (const batch of paginatedGenerator) {
    allItems.push(...batch);
  }

  return allItems;
}
