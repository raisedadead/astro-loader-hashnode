import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createHashnodeClient,
  processPostData,
  createLoader,
  PostsLoader,
} from '../src/index.js';
import {
  calculateDigest,
  LoaderError,
  paginateResults,
  flattenPaginatedResults,
} from '../src/loaders/base.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hashnode Client Advanced Features', () => {
    it('should create client with caching enabled', () => {
      const client = createHashnodeClient({
        publicationHost: 'test.hashnode.dev',
        cache: true,
        cacheTTL: 300000, // 5 minutes
      });

      expect(client).toBeDefined();
      expect(typeof client.getPosts).toBe('function');
      expect(typeof client.searchPosts).toBe('function');
      expect(typeof client.getDrafts).toBe('function');
      expect(typeof client.clearCache).toBe('function');
    });

    it.skip('should handle pagination with large datasets', async () => {
      const mockFirstPage = {
        data: {
          publication: {
            posts: {
              pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
              edges: [
                {
                  node: {
                    id: 'post-1',
                    title: 'First Post',
                    slug: 'first-post',
                    brief: 'First post brief',
                    url: 'https://test.hashnode.dev/first-post',
                    content: { html: '<p>First post content</p>' },
                    publishedAt: '2023-01-01T00:00:00.000Z',
                    readTimeInMinutes: 5,
                    author: {
                      id: 'author-1',
                      name: 'Author',
                      username: 'author',
                    },
                    tags: [],
                  },
                },
              ],
            },
          },
        },
      };

      const mockSecondPage = {
        data: {
          publication: {
            posts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                {
                  node: {
                    id: 'post-2',
                    title: 'Second Post',
                    slug: 'second-post',
                    brief: 'Second post brief',
                    url: 'https://test.hashnode.dev/second-post',
                    content: { html: '<p>Second post content</p>' },
                    publishedAt: '2023-01-02T00:00:00.000Z',
                    readTimeInMinutes: 8,
                    author: {
                      id: 'author-1',
                      name: 'Author',
                      username: 'author',
                    },
                    tags: [],
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFirstPage,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSecondPage,
        });

      const client = createHashnodeClient({
        publicationHost: 'test.hashnode.dev',
      });

      const firstResult = await client.getPosts();
      expect(firstResult.publication.posts.edges).toHaveLength(1);
      expect(firstResult.publication.posts.pageInfo.hasNextPage).toBe(true);

      const secondResult = await client.getPosts({ after: 'cursor-1' });
      expect(secondResult.publication.posts.edges).toHaveLength(1);
      expect(secondResult.publication.posts.pageInfo.hasNextPage).toBe(false);
    });

    it.skip('should handle API rate limiting gracefully', async () => {
      // Simulate rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          errors: [{ message: 'Rate limit exceeded' }],
        }),
      });

      const client = createHashnodeClient({
        publicationHost: 'test.hashnode.dev',
        cache: true,
      });

      await expect(client.getPosts()).rejects.toThrow(
        'HTTP 429: Too Many Requests'
      );
    });

    it.skip('should validate GraphQL responses', async () => {
      const invalidResponse = {
        data: null,
        errors: [
          {
            message: 'Publication not found',
            locations: [{ line: 2, column: 3 }],
            path: ['publication'],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => invalidResponse,
      });

      const client = createHashnodeClient({
        publicationHost: 'invalid.hashnode.dev',
      });

      await expect(client.getPosts()).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('Utility Functions Integration', () => {
    it('should process post data correctly', () => {
      const mockData = {
        title: 'Test Post',
        content: '<p>Test content with <strong>bold</strong> text</p>',
        brief: 'Test brief',
        publishedAt: new Date('2023-01-01'),
        url: 'https://test.hashnode.dev/test-post',
        author: { name: 'Test Author' },
        tags: [{ name: 'JavaScript' }, { name: 'React' }],
      };

      const result = processPostData(mockData);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('seo');
      expect(result).toHaveProperty('sharing');
      expect(result).toHaveProperty('meta');

      expect(result.content).toHaveProperty('text');
      expect(result.content).toHaveProperty('wordCount');
      expect(result.content).toHaveProperty('readingTime');

      expect(result.seo).toHaveProperty('title');
      expect(result.seo).toHaveProperty('description');

      expect(result.sharing).toHaveProperty('twitter');
      expect(result.sharing).toHaveProperty('facebook');
      expect(result.sharing).toHaveProperty('linkedin');

      expect(result.meta).toHaveProperty('timeAgo');
      expect(result.meta).toHaveProperty('isRecent');
      expect(result.meta).toHaveProperty('slug');
    });

    it('should handle empty or minimal data', () => {
      const mockData = {
        title: 'Test Post',
        content: '',
        publishedAt: new Date('2023-01-01'),
        url: 'https://test.hashnode.dev/test-post',
        author: { name: 'Test Author' },
      };

      const result = processPostData(mockData);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('seo');
      expect(result).toHaveProperty('sharing');
      expect(result).toHaveProperty('meta');

      // Should handle empty content gracefully
      expect(result.content.wordCount).toBe(0);
      expect(result.content.readingTime).toBe(0);
    });
  });

  describe('createLoader Factory Function', () => {
    it('should create loader with posts type', async () => {
      const customLoader = await createLoader('posts', {
        publicationHost: 'test.hashnode.dev',
      });

      expect(customLoader).toBeInstanceOf(Object);
      expect(customLoader.constructor.name).toBe('PostsLoader');
    });

    it('should create loader with series type', async () => {
      const customLoader = await createLoader('series', {
        publicationHost: 'test.hashnode.dev',
      });

      expect(customLoader).toBeInstanceOf(Object);
      expect(customLoader.constructor.name).toBe('SeriesLoader');
    });

    it('should create loader with search type', async () => {
      const customLoader = await createLoader('search', {
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript'],
      });

      expect(customLoader).toBeInstanceOf(Object);
      expect(customLoader.constructor.name).toBe('SearchLoader');
    });

    it('should create loader with drafts type', async () => {
      const customLoader = await createLoader('drafts', {
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      expect(customLoader).toBeInstanceOf(Object);
      expect(customLoader.constructor.name).toBe('DraftsLoader');
    });

    it('should handle unknown loader type', async () => {
      await expect(
        // @ts-expect-error - Testing invalid loader type
        createLoader('unknown', {
          publicationHost: 'test.hashnode.dev',
        })
      ).rejects.toThrow('Unknown loader type: unknown');
    });
  });

  describe('Base Loader Utilities', () => {
    it('should calculate digest from string', () => {
      const digest = calculateDigest('hello world');
      expect(typeof digest).toBe('string');
      expect(digest.length).toBeGreaterThan(0);
    });

    it('should calculate digest from object', () => {
      const digest = calculateDigest({ key: 'value', num: 42 });
      expect(typeof digest).toBe('string');
      expect(digest.length).toBeGreaterThan(0);
    });

    it('should produce same digest for same content', () => {
      const digest1 = calculateDigest('test content');
      const digest2 = calculateDigest('test content');
      expect(digest1).toBe(digest2);
    });

    it('should produce different digest for different content', () => {
      const digest1 = calculateDigest('content a');
      const digest2 = calculateDigest('content b');
      expect(digest1).not.toBe(digest2);
    });

    it('should create LoaderError with code and details', () => {
      const error = new LoaderError('test error', 'TEST_CODE', {
        key: 'value',
      });
      expect(error.message).toBe('test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('LoaderError');
    });
  });

  describe('Base Loader Methods via PostsLoader', () => {
    it('should expose getClient() method', () => {
      const loader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const client = loader.getClient();
      expect(client).toBeDefined();
      expect(typeof client.getPosts).toBe('function');
    });

    it('should expose clearCache() method', () => {
      const loader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      // Should not throw
      expect(() => loader.clearCache()).not.toThrow();
    });

    it('should expose schema via createLoader()', () => {
      const loader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const astroLoader = loader.createLoader();
      expect(astroLoader.name).toBe('hashnode-posts');
      expect(typeof astroLoader.schema).toBe('function');
      // Call the schema function
      const schema = (astroLoader.schema as () => unknown)();
      expect(schema).toBeDefined();
    });
  });

  describe('Pagination Utilities', () => {
    it('should paginate through multiple pages', async () => {
      let callCount = 0;
      const generator = paginateResults(async (_cursor?: string) => {
        callCount++;
        if (callCount === 1) {
          return {
            items: [1, 2, 3],
            pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
          };
        }
        return {
          items: [4, 5],
          pageInfo: { hasNextPage: false },
        };
      });

      const results = await flattenPaginatedResults(generator);
      expect(results).toEqual([1, 2, 3, 4, 5]);
      expect(callCount).toBe(2);
    });

    it('should respect maxItems limit across pages', async () => {
      let callCount = 0;
      const generator = paginateResults(async (_cursor?: string) => {
        callCount++;
        return {
          items: [callCount * 10 + 1, callCount * 10 + 2, callCount * 10 + 3],
          pageInfo: { hasNextPage: true, endCursor: `cursor-${callCount}` },
        };
      }, 5);

      const results = await flattenPaginatedResults(generator);
      expect(results).toHaveLength(5);
      expect(results).toEqual([11, 12, 13, 21, 22]);
    });

    it('should stop pagination when empty items returned', async () => {
      let callCount = 0;
      const generator = paginateResults(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            items: [1, 2],
            pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
          };
        }
        return {
          items: [],
          pageInfo: { hasNextPage: true, endCursor: 'cursor-2' },
        };
      });

      const results = await flattenPaginatedResults(generator);
      expect(results).toEqual([1, 2]);
      expect(callCount).toBe(2);
    });

    it('should handle single page of results', async () => {
      const generator = paginateResults(async () => ({
        items: ['a', 'b', 'c'],
        pageInfo: { hasNextPage: false },
      }));

      const results = await flattenPaginatedResults(generator);
      expect(results).toEqual(['a', 'b', 'c']);
    });

    it('should handle maxItems smaller than first page', async () => {
      const generator = paginateResults(
        async () => ({
          items: [1, 2, 3, 4, 5],
          pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
        }),
        2
      );

      const results = await flattenPaginatedResults(generator);
      expect(results).toEqual([1, 2]);
    });
  });

  describe('Cross-Loader Compatibility', () => {
    it('should maintain consistent interfaces across loaders', async () => {
      const postsLoader = await createLoader('posts', {
        publicationHost: 'test.hashnode.dev',
      });

      const seriesLoader = await createLoader('series', {
        publicationHost: 'test.hashnode.dev',
      });

      const searchLoader = await createLoader('search', {
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['test'],
      });

      // All loaders should have consistent base functionality
      expect(typeof postsLoader.load).toBe('function');
      expect(typeof seriesLoader.load).toBe('function');
      expect(typeof searchLoader.load).toBe('function');

      expect(typeof postsLoader.getClient).toBe('function');
      expect(typeof seriesLoader.getClient).toBe('function');
      expect(typeof searchLoader.getClient).toBe('function');
    });
  });
});
