import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createHashnodeClient,
  processPostData,
  createLoader,
} from '../src/index.js';

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
