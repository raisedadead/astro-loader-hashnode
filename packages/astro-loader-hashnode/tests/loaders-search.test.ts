import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLoader, SearchLoader } from '../src/index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Search Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Factory Functions', () => {
    it('should create search loader', () => {
      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'react', 'typescript'],
        maxResults: 10,
      });

      expect(loader.name).toBe('hashnode-search');
      expect(typeof loader.load).toBe('function');
    });

    it('should create search loader with minimal options', () => {
      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript'],
      });

      expect(loader.name).toBe('hashnode-search');
      expect(typeof loader.load).toBe('function');
    });
  });

  describe('Search Loader Class', () => {
    it('should create search loader with search terms', () => {
      const loader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'react'],
      });

      expect(loader).toBeInstanceOf(SearchLoader);
    });

    it('should handle basic search loading', () => {
      const loader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['react', 'vue'],
        maxResults: 5,
      });

      expect(loader).toBeInstanceOf(SearchLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle search configuration options', () => {
      const basicSearch = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript'],
      });

      const advancedSearch = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'typescript', 'react'],
        maxResults: 10,
      });

      expect(basicSearch).toBeInstanceOf(SearchLoader);
      expect(advancedSearch).toBeInstanceOf(SearchLoader);
    });
  });

  describe('Search Results Handling', () => {
    it('should handle search results', async () => {
      const mockResponse = {
        data: {
          searchPostsOfPublication: {
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                node: {
                  id: 'search-result-1',
                  title: 'Advanced JavaScript Concepts',
                  slug: 'advanced-javascript-concepts',
                  brief: 'Deep dive into JavaScript closures and prototypes',
                  url: 'https://test.hashnode.dev/advanced-javascript-concepts',
                  content: {
                    html: '<p>JavaScript closures are <strong>powerful</strong></p>',
                  },
                  publishedAt: '2023-05-15T00:00:00.000Z',
                  readTimeInMinutes: 12,
                  author: {
                    id: 'author-1',
                    name: 'JavaScript Expert',
                    username: 'jsexpert',
                  },
                  tags: [
                    {
                      id: 'tag-1',
                      name: 'JavaScript',
                      slug: 'javascript',
                    },
                    {
                      id: 'tag-2',
                      name: 'Advanced',
                      slug: 'advanced',
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript'],
      });

      const mockStore = {
        set: vi.fn(),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
      };

      await loader.load({
        store: mockStore,
        logger: console,
        parseData: async data => data,
      });

      expect(mockStore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'search-result-1',
          data: expect.any(Object),
        })
      );

      // Verify that search data was processed successfully
      const callArgs = mockStore.set.mock.calls[0][0];
      expect(callArgs.data.data.title).toBe('Advanced JavaScript Concepts');
      expect(callArgs.data.data.id).toBe('search-result-1');
    });
  });

  describe('Configuration Options', () => {
    it('should handle different search configurations', () => {
      const basicSearch = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript'],
      });
      expect(basicSearch.name).toBe('hashnode-search');

      const advancedSearch = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'react', 'typescript'],
        maxResults: 10,
      });
      expect(advancedSearch.name).toBe('hashnode-search');
    });

    it('should handle missing search terms gracefully', () => {
      const loader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        // Missing searchTerms - should not throw, but handle gracefully
      });

      expect(loader).toBeInstanceOf(SearchLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle various search term configurations', () => {
      const singleTermLoader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['react'],
      });

      const multipleTermsLoader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['react', 'vue', 'angular', 'svelte'],
        maxResults: 15,
      });

      expect(singleTermLoader).toBeInstanceOf(SearchLoader);
      expect(multipleTermsLoader).toBeInstanceOf(SearchLoader);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty search results', () => {
      const loader = new SearchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['nonexistent-term-12345'],
      });

      expect(loader).toBeInstanceOf(SearchLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle empty searchTerms by returning no results', async () => {
      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: [],
      });

      const mockStore = {
        set: vi.fn(),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
        entries: vi.fn().mockReturnValue([]),
        values: vi.fn().mockReturnValue([]),
        addModuleImport: vi.fn(),
      };
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        options: {},
        label: 'test',
        fork: vi.fn(),
      } as any;

      await loader.load({
        store: mockStore as any,
        logger: mockLogger,
        collection: 'search',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      expect(mockStore.set).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should deduplicate and sort search results across multiple terms', async () => {
      const makeSearchResponse = (
        id: string,
        title: string,
        brief: string
      ) => ({
        data: {
          searchPostsOfPublication: {
            pageInfo: { hasNextPage: false, endCursor: null },
            edges: [
              {
                node: {
                  id,
                  cuid: `cuid-${id}`,
                  slug: `slug-${id}`,
                  title,
                  brief,
                  url: `https://test.hashnode.dev/${id}`,
                  publishedAt: '2023-05-15T00:00:00.000Z',
                  reactionCount: 10,
                  views: 500,
                  author: {
                    id: 'author-1',
                    name: 'Author',
                    username: 'author',
                  },
                },
                cursor: 'cursor-1',
              },
            ],
          },
        },
      });

      // Same post returned for both search terms
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeSearchResponse(
              'post-1',
              'JavaScript Guide',
              'Learn JavaScript'
            ),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            makeSearchResponse(
              'post-1',
              'JavaScript Guide',
              'Learn JavaScript'
            ),
        });

      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'guide'],
      });

      const mockStore = {
        set: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
        entries: vi.fn().mockReturnValue([]),
        values: vi.fn().mockReturnValue([]),
        addModuleImport: vi.fn(),
      };
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        options: {},
        label: 'test',
        fork: vi.fn(),
      } as any;

      await loader.load({
        store: mockStore as any,
        logger: mockLogger,
        collection: 'search',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Deduplicated to 1
      expect(mockStore.set).toHaveBeenCalledTimes(1);
    });

    it('should continue searching when individual term fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              searchPostsOfPublication: {
                pageInfo: { hasNextPage: false, endCursor: null },
                edges: [
                  {
                    node: {
                      id: 'post-1',
                      cuid: 'cuid-1',
                      slug: 'post-1',
                      title: 'Result',
                      brief: 'Brief',
                      url: 'https://test.hashnode.dev/post-1',
                      publishedAt: '2023-05-15T00:00:00.000Z',
                      reactionCount: 0,
                      views: 0,
                      author: {
                        id: 'author-1',
                        name: 'Author',
                        username: 'author',
                      },
                    },
                    cursor: 'cursor-1',
                  },
                ],
              },
            },
          }),
        })
        .mockRejectedValueOnce(new Error('Search failed'));

      const loader = searchLoader({
        publicationHost: 'test.hashnode.dev',
        searchTerms: ['javascript', 'failing-term'],
      });

      const mockStore = {
        set: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
        entries: vi.fn().mockReturnValue([]),
        values: vi.fn().mockReturnValue([]),
        addModuleImport: vi.fn(),
      };
      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        options: {},
        label: 'test',
        fork: vi.fn(),
      } as any;

      await loader.load({
        store: mockStore as any,
        logger: mockLogger,
        collection: 'search',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      // First term's result should still be stored
      expect(mockStore.set).toHaveBeenCalledTimes(1);
    });
  });
});
