import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HashnodeClient } from '../src/api/client.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('HashnodeClient', () => {
  let client: HashnodeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new HashnodeClient({
      publicationHost: 'test.hashnode.dev',
      token: 'test-token',
    });
  });

  describe('Client Initialization', () => {
    it('creates client instance with valid configuration', () => {
      expect(client).toBeInstanceOf(HashnodeClient);
    });

    it('creates client instance even with empty publication host', () => {
      // This test should pass - the client doesn't throw on empty host
      const client = new HashnodeClient({
        publicationHost: '',
      });
      expect(client).toBeInstanceOf(HashnodeClient);
    });
  });

  describe('API Responses', () => {
    it('should handle successful API response', async () => {
      const mockResponse = {
        data: {
          publication: {
            id: 'test-id',
            title: 'Test Publication',
            url: 'https://test.hashnode.dev',
            posts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                {
                  node: {
                    id: 'post-1',
                    title: 'Test Post',
                    slug: 'test-post',
                    content: { html: '<p>Test content</p>' },
                    brief: 'Test brief',
                    coverImage: { url: 'https://example.com/cover.jpg' },
                    publishedAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    readTimeInMinutes: 5,
                    url: 'https://test.hashnode.dev/test-post',
                    author: {
                      id: 'author-1',
                      name: 'Test Author',
                      username: 'testauthor',
                      profilePicture: 'https://example.com/avatar.jpg',
                    },
                    tags: [{ id: 'tag-1', name: 'Test Tag', slug: 'test-tag' }],
                    series: null,
                  },
                },
              ],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getPosts();
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        errors: [
          {
            message: 'GraphQL Error: Publication not found',
            locations: [{ line: 2, column: 3 }],
            path: ['publication'],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(client.getPosts()).rejects.toThrow(
        'GraphQL Error: Publication not found'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      await expect(client.getPosts()).rejects.toThrow('Network Error');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.getPosts()).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      );
    });
  });

  describe('Authentication', () => {
    it('includes authorization header when token is provided', async () => {
      const mockResponse = {
        data: {
          me: {
            drafts: {
              edges: [
                {
                  node: {
                    id: 'draft-1',
                    title: 'Draft Post',
                    slug: 'draft-post',
                  },
                },
              ],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.getDrafts();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com/',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'test-token',
          }),
        })
      );
    });

    it('requires authentication token to access drafts', async () => {
      const unauthenticatedClient = new HashnodeClient({
        publicationHost: 'test.hashnode.dev',
        // No token provided
      });

      const mockErrorResponse = {
        errors: [
          {
            message: 'Authentication token required for accessing drafts',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(unauthenticatedClient.getDrafts()).rejects.toThrow(
        'Authentication token required for accessing drafts'
      );
    });

    it('omits authorization header when no token is provided', async () => {
      // Reset fetch mock completely
      (global.fetch as any) = vi.fn();

      const unauthenticatedClient = new HashnodeClient({
        publicationHost: 'test.hashnode.dev',
      });

      const mockResponse = {
        data: {
          publication: {
            id: 'test-id',
            posts: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await unauthenticatedClient.getPosts();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com/',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });
  });

  describe('Caching Behavior', () => {
    it('should cache successful responses when caching is enabled', async () => {
      const mockResponse = {
        data: {
          publication: {
            id: 'test-id',
            posts: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call should make network request
      await client.getPosts();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getPosts();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should allow disabling cache', async () => {
      const clientWithoutCache = new HashnodeClient({
        publicationHost: 'test.hashnode.dev',
        cache: false,
      });

      const mockResponse = {
        data: {
          publication: {
            id: 'test-id',
            posts: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Both calls should make network requests
      await clientWithoutCache.getPosts();
      await clientWithoutCache.getPosts();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response Caching', () => {
    beforeEach(() => {
      client = new HashnodeClient({
        publicationHost: 'test.hashnode.dev',
        cache: true,
        cacheTTL: 300,
      });
    });

    it('should clear cache when requested', async () => {
      const mockResponse = {
        data: {
          publication: {
            id: 'test-id',
            posts: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call
      await client.getPosts();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      client.clearCache();

      // Next call should make new request
      await client.getPosts();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
