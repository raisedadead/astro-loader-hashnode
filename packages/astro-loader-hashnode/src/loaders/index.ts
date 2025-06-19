/**
 * Loaders - Export all Hashnode loaders
 */

// Base loader
export {
  BaseHashnodeLoader,
  calculateDigest,
  LoaderError,
  paginateResults,
  flattenPaginatedResults,
} from './base.js';
export type { LoaderResult, BaseLoaderConfig } from './base.js';

// Posts loader
export { PostsLoader, createPostsLoader, postsLoader } from './posts.js';

// Series loader
export { SeriesLoader, createSeriesLoader, seriesLoader } from './series.js';

// Search loader
export { SearchLoader, createSearchLoader, searchLoader } from './search.js';

// Drafts loader
export { DraftsLoader, createDraftsLoader, draftsLoader } from './drafts.js';

// Convenience function to create any loader by type
export async function createLoader(
  type: 'posts' | 'series' | 'search' | 'drafts',
  options:
    | import('../types/loader.js').PostsLoaderOptions
    | import('../types/loader.js').SeriesLoaderOptions
    | import('../types/loader.js').SearchLoaderOptions
    | import('../types/loader.js').DraftsLoaderOptions
): Promise<import('./base.js').BaseHashnodeLoader> {
  switch (type) {
    case 'posts': {
      const { createPostsLoader } = await import('./posts.js');
      return createPostsLoader(options);
    }
    case 'series': {
      const { createSeriesLoader } = await import('./series.js');
      return createSeriesLoader(options);
    }
    case 'search': {
      const { createSearchLoader } = await import('./search.js');
      return createSearchLoader(options);
    }
    case 'drafts': {
      const { createDraftsLoader } = await import('./drafts.js');
      return createDraftsLoader(options);
    }
    default:
      throw new Error(`Unknown loader type: ${type}`);
  }
}
