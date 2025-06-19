import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashnodeLoader, postsLoader, PostsLoader } from '../src/index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Posts Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Factory Functions', () => {
    it('should create a posts loader with hashnodeLoader', () => {
      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
      });

      expect(loader.name).toBe('hashnode-posts');
      expect(typeof loader.load).toBe('function');
    });

    it('should create a posts loader with postsLoader', () => {
      const loader = postsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      expect(loader.name).toBe('hashnode-posts');
      expect(typeof loader.load).toBe('function');
    });

    it('should create a posts loader with custom options', () => {
      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 50,
        includeDrafts: true,
        includeComments: true,
      });

      expect(loader.name).toBe('hashnode-posts');
      expect(typeof loader.load).toBe('function');
    });
  });

  describe('Posts Loader with Advanced Options', () => {
    it('should create posts loader with advanced options', () => {
      const loader = postsLoader({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 100,
        includeDrafts: true,
        includeComments: true,
        includeCoAuthors: true,
        includeTableOfContents: true,
        tags: ['javascript', 'react'],
        minReadTime: 5,
        maxReadTime: 30,
        publishedAfter: new Date('2023-01-01'),
        publishedBefore: new Date('2024-01-01'),
      });

      expect(loader.name).toBe('hashnode-posts');
      expect(typeof loader.load).toBe('function');
    });

    it('should handle posts with enhanced metadata', async () => {
      const mockResponse = {
        data: {
          publication: {
            posts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                {
                  node: {
                    id: '1',
                    cuid: 'cuid-1',
                    slug: 'enhanced-post',
                    title: 'Enhanced Post',
                    subtitle: 'With Enhanced Features',
                    brief: 'This post has enhanced features',
                    url: 'https://test.hashnode.dev/enhanced-post',
                    canonicalUrl: 'https://test.hashnode.dev/enhanced-post',
                    content: {
                      html: '<h1>Enhanced Content</h1><p>With table of contents</p>',
                      markdown: '# Enhanced Content\n\nWith table of contents',
                    },
                    publishedAt: '2023-06-01T00:00:00.000Z',
                    updatedAt: '2023-06-01T00:00:00.000Z',
                    createdAt: '2023-06-01T00:00:00.000Z',
                    readTimeInMinutes: 10,
                    views: 500,
                    reactionCount: 25,
                    responseCount: 5,
                    replyCount: 3,
                    hasLatexInPost: false,
                    author: {
                      id: 'author-1',
                      name: 'Enhanced Author',
                      username: 'enhancedauthor',
                      profilePicture: 'https://example.com/enhanced-avatar.jpg',
                      bio: {
                        text: 'Enhanced author bio',
                        html: '<p>Enhanced author bio</p>',
                      },
                      socialMediaLinks: {
                        website: 'https://example.com',
                        github: 'https://github.com/enhanced',
                        twitter: 'https://twitter.com/enhanced',
                        linkedin: 'https://linkedin.com/in/enhanced',
                      },
                      followersCount: 1000,
                    },
                    coAuthors: [
                      {
                        id: 'coauthor-1',
                        name: 'Co Author',
                        username: 'coauthor',
                        profilePicture: 'https://example.com/coauthor.jpg',
                        bio: { html: '<p>Co author bio</p>' },
                      },
                    ],
                    tags: [
                      {
                        id: 'tag-1',
                        name: 'JavaScript',
                        slug: 'javascript',
                      },
                      {
                        id: 'tag-2',
                        name: 'React',
                        slug: 'react',
                      },
                    ],
                    seo: {
                      title: 'Enhanced SEO Title',
                      description: 'Enhanced SEO description',
                    },
                    ogMetaData: {
                      image: 'https://example.com/og-image.jpg',
                    },
                    series: {
                      id: 'series-1',
                      name: 'JavaScript Series',
                      slug: 'javascript-series',
                    },
                    features: {
                      tableOfContents: {
                        isEnabled: true,
                        items: [
                          {
                            id: 'heading-1',
                            level: 1,
                            slug: 'enhanced-content',
                            title: 'Enhanced Content',
                          },
                        ],
                      },
                    },
                    preferences: {
                      disableComments: false,
                      stickCoverToBottom: false,
                    },
                    coverImage: {
                      url: 'https://example.com/cover.jpg',
                      attribution: 'Photo by Example',
                      isPortrait: false,
                      isAttributionHidden: false,
                    },
                    comments: {
                      totalDocuments: 5,
                      edges: [
                        {
                          node: {
                            id: 'comment-1',
                            dateAdded: '2023-06-02T00:00:00.000Z',
                            totalReactions: 2,
                            content: {
                              html: '<p>Great post!</p>',
                              markdown: 'Great post!',
                            },
                            author: {
                              id: 'commenter-1',
                              name: 'Commenter',
                              username: 'commenter',
                              profilePicture:
                                'https://example.com/commenter.jpg',
                            },
                            replies: {
                              edges: [
                                {
                                  node: {
                                    id: 'reply-1',
                                    dateAdded: '2023-06-03T00:00:00.000Z',
                                    content: {
                                      html: '<p>Thank you!</p>',
                                      markdown: 'Thank you!',
                                    },
                                    author: {
                                      id: 'author-1',
                                      name: 'Enhanced Author',
                                      username: 'enhancedauthor',
                                      profilePicture:
                                        'https://example.com/enhanced-avatar.jpg',
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = postsLoader({
        publicationHost: 'test.hashnode.dev',
        includeComments: true,
        includeCoAuthors: true,
        includeTableOfContents: true,
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
          id: '1',
          data: expect.any(Object),
        })
      );

      // Verify that data was processed successfully
      const callArgs = mockStore.set.mock.calls[0][0];
      expect(callArgs.data.data.title).toBe('Enhanced Post');
      expect(callArgs.data.data.slug).toBe('enhanced-post');
    });
  });

  describe('API Integration', () => {
    it('should handle successful API response', async () => {
      const mockResponse = {
        data: {
          publication: {
            id: 'pub-123',
            title: 'Test Blog',
            posts: {
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
              },
              edges: [
                {
                  node: {
                    id: '1',
                    cuid: 'cuid-1',
                    slug: 'test-post',
                    title: 'Test Post',
                    subtitle: 'Test Subtitle',
                    brief: 'Test brief',
                    url: 'https://test.hashnode.dev/test-post',
                    canonicalUrl: 'https://test.hashnode.dev/test-post',
                    content: {
                      html: '<p>Test content</p>',
                      markdown: 'Test content',
                    },
                    publishedAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z',
                    createdAt: '2023-01-01T00:00:00.000Z',
                    readTimeInMinutes: 5,
                    views: 100,
                    reactionCount: 10,
                    author: {
                      id: 'author-1',
                      name: 'Test Author',
                      username: 'testauthor',
                      profilePicture: 'https://example.com/avatar.jpg',
                    },
                    tags: [
                      {
                        id: 'tag-1',
                        name: 'JavaScript',
                        slug: 'javascript',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
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

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(mockStore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          data: expect.any(Object),
        })
      );
    });

    it('should include authorization header when token is provided', async () => {
      const mockResponse = {
        data: {
          publication: {
            posts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
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

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com/',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'test-token',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const mockStore = {
        set: vi.fn(),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
      };

      // Should not throw, but may log errors
      await expect(
        loader.load({
          store: mockStore,
          logger: { info: vi.fn(), error: vi.fn() },
          parseData: async data => data,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Posts Loader Class', () => {
    it('should create posts loader instance', () => {
      const loader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      expect(loader).toBeInstanceOf(PostsLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle posts loader with different options', () => {
      const basicLoader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const advancedLoader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 50,
        includeComments: true,
        includeCoAuthors: true,
        includeTableOfContents: true,
      });

      expect(basicLoader).toBeInstanceOf(PostsLoader);
      expect(advancedLoader).toBeInstanceOf(PostsLoader);
    });

    it('should handle filtering options', () => {
      const filteredLoader = new PostsLoader({
        publicationHost: 'test.hashnode.dev',
        tags: ['javascript', 'react'],
        minReadTime: 5,
        maxReadTime: 30,
        publishedAfter: new Date('2023-01-01'),
        publishedBefore: new Date('2024-01-01'),
      });

      expect(filteredLoader).toBeInstanceOf(PostsLoader);
    });
  });

  describe('Data Processing', () => {
    it('should handle data processing correctly', async () => {
      const mockResponse = {
        data: {
          publication: {
            posts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                {
                  node: {
                    id: '1',
                    cuid: 'cuid-1',
                    slug: 'test-post',
                    title: 'Test Post',
                    brief: 'Test brief',
                    url: 'https://test.hashnode.dev/test-post',
                    content: { html: '<p>Test content</p>' },
                    publishedAt: '2023-01-01T00:00:00.000Z',
                    readTimeInMinutes: 5,
                    author: {
                      id: 'author-1',
                      name: 'Test Author',
                      username: 'testauthor',
                    },
                    tags: [],
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const mockStore = {
        set: vi.fn(),
        clear: vi.fn(),
        keys: vi.fn().mockReturnValue([]),
        delete: vi.fn(),
        get: vi.fn().mockReturnValue(undefined),
        has: vi.fn().mockReturnValue(false),
      };

      // Mock parseData to return the data as-is for testing
      const mockParseData = vi.fn().mockImplementation(async data => data);

      await loader.load({
        store: mockStore,
        logger: console,
        parseData: mockParseData,
      });

      // Verify the loader processes data correctly
      expect(mockFetch).toHaveBeenCalled();
      expect(mockParseData).toHaveBeenCalled();
    });
  });
});
