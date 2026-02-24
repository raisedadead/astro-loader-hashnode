import { describe, it, expect, vi, beforeEach } from 'vitest';
import { draftsLoader, DraftsLoader } from '../src/index.js';
import type { HashnodePost } from '../src/types/hashnode.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Drafts Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Factory Functions', () => {
    it('should create drafts loader', () => {
      const loader = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'draft-access-token',
        maxDrafts: 50,
      });

      expect(loader.name).toBe('hashnode-drafts');
      expect(typeof loader.load).toBe('function');
    });

    it('should require authentication token', () => {
      expect(() => {
        draftsLoader({
          publicationHost: 'test.hashnode.dev',
          // Missing token
        });
      }).toThrow('Authentication token is required for accessing drafts');
    });
  });

  describe('Drafts Loader Class', () => {
    it('should require authentication token', () => {
      expect(() => {
        new DraftsLoader({
          publicationHost: 'test.hashnode.dev',
          // No token provided
        });
      }).toThrow('Authentication token is required for accessing drafts');
    });

    it('should create drafts loader with token', () => {
      const loader = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      expect(loader).toBeInstanceOf(DraftsLoader);
    });

    it('should handle basic draft loading', () => {
      const loader = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      expect(loader).toBeInstanceOf(DraftsLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle different draft options', () => {
      const loader1 = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
        draftId: 'specific-draft-1',
      });

      const loader2 = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
        maxDrafts: 50,
      });

      expect(loader1).toBeInstanceOf(DraftsLoader);
      expect(loader2).toBeInstanceOf(DraftsLoader);
    });
  });

  describe('Draft Transformation Logic', () => {
    let loader: DraftsLoader;

    beforeEach(() => {
      loader = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });
    });

    it('should transform complete draft data correctly', () => {
      const mockDraft: HashnodePost = {
        id: 'draft-123',
        cuid: 'cuid-456',
        title: 'My Draft Post',
        subtitle: 'Draft subtitle',
        brief: 'Draft brief',
        slug: 'my-draft-post',
        content: {
          html: '<p>Draft HTML content</p>',
          markdown: '# Draft markdown content',
        },
        canonicalUrl: 'https://example.com/canonical',
        updatedAt: '2023-12-01T10:00:00.000Z',
        createdAt: '2023-11-01T10:00:00.000Z',
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 5,
        author: {
          id: 'author-1',
          name: 'Test Author',
          username: 'testauthor',
          profilePicture: 'https://example.com/profile.jpg',
        },
        coverImage: {
          url: 'https://example.com/cover.jpg',
        },
        tags: [
          {
            id: 'tag-1',
            name: 'JavaScript',
            slug: 'javascript',
          },
        ],
      };

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed).toEqual({
        id: 'draft-draft-123', // The transformHashnodeDraft function adds 'draft-' prefix
        title: 'My Draft Post',
        subtitle: 'Draft subtitle',
        content: '# Draft markdown content',
        canonicalUrl: 'https://example.com/canonical',
        updatedAt: new Date('2023-12-01T10:00:00.000Z'),
        createdAt: new Date('2023-12-01T10:00:00.000Z'),
        author: {
          id: 'author-1',
          name: 'Test Author',
          username: 'testauthor',
          profilePicture: 'https://example.com/profile.jpg',
        },
        coverImage: {
          url: 'https://example.com/cover.jpg',
        },
        tags: [
          {
            id: 'tag-1',
            name: 'JavaScript',
            slug: 'javascript',
          },
        ],
        tableOfContents: [],
        isDraft: true,
        lastSaved: new Date('2023-12-01T10:00:00.000Z'),
        raw: {
          id: 'draft-123',
        },
      });
    });

    it('should handle draft with minimal data', () => {
      const mockDraft: HashnodePost = {
        id: 'draft-minimal',
        title: 'Minimal Draft',
        brief: 'Brief',
        slug: 'minimal',
        content: {
          html: '<p>Content</p>',
        },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed.id).toBe('draft-draft-minimal'); // The transformHashnodeDraft function adds 'draft-' prefix
      expect(transformed.title).toBe('Minimal Draft');
      expect(transformed.subtitle).toBe('');
      expect(transformed.content).toBe('<p>Content</p>');
      expect(transformed.canonicalUrl).toBe('');
      expect(transformed.isDraft).toBe(true);
      expect(transformed.tags).toEqual([]);
      expect(transformed.coverImage).toBeUndefined();
    });

    it('should handle draft with missing author data', () => {
      const mockDraft: HashnodePost = {
        id: 'draft-no-author',
        title: 'No Author Draft',
        brief: 'Brief',
        slug: 'no-author',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: '',
          name: '',
          username: '',
        },
        tags: [],
      };

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed.author).toEqual({
        id: 'unknown',
        name: 'Unknown Author',
        username: 'unknown',
        profilePicture: '',
      });
    });

    it('should handle draft with missing content', () => {
      const mockDraft: HashnodePost = {
        id: 'draft-no-content',
        title: 'No Content Draft',
        brief: 'Brief',
        slug: 'no-content',
        content: { html: '' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed.content).toBe('');
    });

    it('should generate fallback ID when no proper ID exists', () => {
      const mockDraft: HashnodePost = {
        id: '',
        title: 'No ID Draft',
        brief: 'Brief',
        slug: '',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        updatedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      const id = loader['generateId'](mockDraft);

      expect(id).toMatch(/^draft-[a-z0-9]+$/);
    });

    it('should use cuid as fallback ID', () => {
      const mockDraft: HashnodePost = {
        id: '',
        cuid: 'cuid-fallback',
        title: 'CUID Draft',
        brief: 'Brief',
        slug: '',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      const id = loader['generateId'](mockDraft);

      expect(id).toBe('draft-cuid-fallback');
    });

    it('should use slug as fallback ID', () => {
      const mockDraft: HashnodePost = {
        id: '',
        title: 'Slug Draft',
        brief: 'Brief',
        slug: 'slug-fallback',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      const id = loader['generateId'](mockDraft);

      expect(id).toBe('draft-slug-fallback');
    });

    it('should handle tags with missing data', () => {
      const mockDraft: HashnodePost = {
        id: 'draft-tags',
        title: 'Tags Draft',
        brief: 'Brief',
        slug: 'tags-draft',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [
          {
            id: '',
            name: '',
            slug: '',
          },
          {
            id: 'tag-2',
            name: 'Valid Tag',
            slug: 'valid-tag',
          },
        ],
      };

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed.tags).toEqual([
        {
          id: 'unknown',
          name: 'Unknown Tag',
          slug: 'unknown',
        },
        {
          id: 'tag-2',
          name: 'Valid Tag',
          slug: 'valid-tag',
        },
      ]);
    });
  });

  describe('Draft Transformation - Hash Fallback', () => {
    let loader: DraftsLoader;

    beforeEach(() => {
      loader = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });
    });

    it('should generate hash-based ID when draft has no id/cuid/slug', () => {
      const mockDraft: HashnodePost = {
        id: '',
        title: 'No ID Draft',
        brief: 'Brief',
        slug: '',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        updatedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        tags: [],
      };

      // The transformItem's internal generateDraftId should use the hash fallback
      const transformed = loader['transformItem'](mockDraft);

      // The transform function's ID should use hash fallback (draft- prefix + hash)
      expect(transformed.id).toMatch(/^draft-[a-z0-9]+$/);
    });

    it('should handle draft with no author object', () => {
      const mockDraft = {
        id: 'draft-1',
        title: 'Draft',
        brief: 'Brief',
        slug: 'draft-1',
        content: { html: '<p>Content</p>' },
        publishedAt: '2023-12-01T10:00:00.000Z',
        readTimeInMinutes: 1,
        tags: [],
      } as unknown as HashnodePost;

      const transformed = loader['transformItem'](mockDraft);

      expect(transformed.author).toEqual({
        id: 'unknown',
        name: 'Unknown Author',
        username: 'unknown',
        profilePicture: '',
      });
    });
  });

  describe('Draft Data Handling', () => {
    it('should fetch all drafts via load()', async () => {
      const mockResponse = {
        data: {
          me: {
            drafts: {
              edges: [
                {
                  node: {
                    id: 'draft-1',
                    title: 'Draft Post 1',
                    subtitle: '',
                    content: {
                      html: '<p>Draft content</p>',
                      markdown: 'Draft content',
                    },
                    brief: 'Draft brief',
                    slug: 'draft-post-1',
                    coverImage: null,
                    tags: [],
                    author: {
                      id: 'author-1',
                      name: 'Draft Author',
                      username: 'draftauthor',
                    },
                    updatedAt: '2023-06-01T00:00:00.000Z',
                    readTimeInMinutes: 5,
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

      const loader = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'draft-access-token',
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
        collection: 'drafts',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fetch specific draft by ID via includeDraftById', async () => {
      const mockResponse = {
        data: {
          draft: {
            id: 'specific-draft-123',
            title: 'Specific Draft',
            subtitle: '',
            content: {
              html: '<p>Specific draft content</p>',
              markdown: 'Specific draft content',
            },
            brief: 'Specific draft brief',
            slug: 'specific-draft',
            coverImage: null,
            tags: [],
            author: {
              id: 'author-1',
              name: 'Author',
              username: 'author',
            },
            updatedAt: '2023-06-01T00:00:00.000Z',
            readTimeInMinutes: 3,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'draft-access-token',
        includeDraftById: 'specific-draft-123',
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
        collection: 'drafts',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should handle null draft when fetching by ID', async () => {
      const mockResponse = {
        data: {
          draft: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const loader = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'draft-access-token',
        includeDraftById: 'nonexistent-draft',
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
        collection: 'drafts',
        meta: {},
        config: {},
        renderMarkdown: async (md: string) => ({ html: md, metadata: {} }),
        generateDigest: (obj: unknown) => JSON.stringify(obj).length.toString(),
        parseData: async (props: any) => props,
      } as any);

      // No items should be stored since draft is null
      expect(mockStore.set).not.toHaveBeenCalled();
    });

    it.skip('should handle draft posts (legacy)', async () => {
      const mockResponse = {
        data: {
          me: {
            drafts: {
              pageInfo: { hasNextPage: false, endCursor: null },
              edges: [
                {
                  node: {
                    id: 'draft-1',
                    title: 'Upcoming JavaScript Article',
                    subtitle: 'Still in progress',
                    content: {
                      html: '<p>Draft content here...</p>',
                      markdown: 'Draft content here...',
                    },
                    brief: 'This article is still being written',
                    slug: 'upcoming-javascript-article',
                    coverImage: {
                      url: 'https://example.com/draft-cover.jpg',
                    },
                    tags: [
                      {
                        id: 'tag-1',
                        name: 'JavaScript',
                        slug: 'javascript',
                      },
                    ],
                    author: {
                      id: 'author-1',
                      name: 'Draft Author',
                      username: 'draftauthor',
                    },
                    updatedAt: '2023-06-01T00:00:00.000Z',
                    readTimeInMinutes: 7,
                    seo: {
                      title: 'Draft SEO Title',
                      description: 'Draft SEO description',
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

      const loader = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'draft-access-token',
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
          id: 'draft-1',
          data: expect.objectContaining({
            id: 'draft-1',
            title: 'Upcoming JavaScript Article',
          }),
        })
      );
    });
  });

  describe('Configuration Options', () => {
    it('should handle different drafts configurations', () => {
      const basicDrafts = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      const advancedDrafts = draftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
        maxDrafts: 25,
      });

      expect(basicDrafts.name).toBe('hashnode-drafts');
      expect(advancedDrafts.name).toBe('hashnode-drafts');
    });

    it('should handle specific draft ID loading', () => {
      const loader = new DraftsLoader({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
        draftId: 'specific-draft-123',
      });

      expect(loader).toBeInstanceOf(DraftsLoader);
    });

    it('should validate token requirement', () => {
      expect(() => {
        new DraftsLoader({
          publicationHost: 'test.hashnode.dev',
          // Missing required token
        });
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing token gracefully', () => {
      expect(() => {
        draftsLoader({
          publicationHost: 'test.hashnode.dev',
          // No token
        });
      }).toThrow('Authentication token is required for accessing drafts');
    });
  });
});
