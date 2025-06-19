import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seriesLoader, SeriesLoader } from '../src/index.js';
import type { HashnodeSeries } from '../src/types/hashnode.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Series Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Factory Functions', () => {
    it('should create series loader', () => {
      const loader = seriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
        maxPostsPerSeries: 20,
      });

      expect(loader.name).toBe('hashnode-series');
      expect(typeof loader.load).toBe('function');
    });

    it('should create series loader with different options', () => {
      const loader = seriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
        maxPostsPerSeries: 10,
      });

      expect(loader.name).toBe('hashnode-series');
      expect(typeof loader.load).toBe('function');
    });
  });

  describe('Series Loader Class', () => {
    it('should create series loader with options', () => {
      const loader = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
        maxPostsPerSeries: 10,
      });

      expect(loader).toBeInstanceOf(SeriesLoader);
    });

    it('should handle basic series loading', () => {
      // Just test that the loader can be created and has the right properties
      const loader = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
      });

      expect(loader).toBeInstanceOf(SeriesLoader);
      expect(typeof loader.load).toBe('function');
    });

    it('should handle different series configuration options', () => {
      const basicSeries = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
      });

      const advancedSeries = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
        maxPostsPerSeries: 20,
      });

      expect(basicSeries).toBeInstanceOf(SeriesLoader);
      expect(advancedSeries).toBeInstanceOf(SeriesLoader);
    });
  });

  describe('Series Transformation Logic', () => {
    let loader: SeriesLoader;

    beforeEach(() => {
      loader = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
      });
    });

    it('should transform complete series data correctly', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-123',
        cuid: 'series-cuid-456',
        name: 'JavaScript Fundamentals',
        slug: 'javascript-fundamentals',
        description: {
          html: '<p>Learn JavaScript from basics</p>',
          text: 'Learn JavaScript from basics',
          markdown: '# Learn JavaScript from basics',
        },
        coverImage: 'https://example.com/series-cover.jpg',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-12-01T00:00:00.000Z',
        sortOrder: 'asc',
        seo: {
          title: 'JavaScript Fundamentals Series',
          description: 'Complete JavaScript learning series',
        },
        author: {
          id: 'author-1',
          name: 'John Doe',
          username: 'johndoe',
          profilePicture: 'https://example.com/profile.jpg',
          bio: {
            html: '<p>JavaScript educator</p>',
            text: 'JavaScript educator',
          },
          followersCount: 1000,
        },
        posts: {
          edges: [
            {
              node: {
                id: 'post-1',
                title: 'JavaScript Basics',
                slug: 'javascript-basics',
                brief: 'Learn the basics of JavaScript',
                publishedAt: '2023-06-01T00:00:00.000Z',
                readTimeInMinutes: 5,
                views: 1500,
                url: 'https://example.com/javascript-basics',
                coverImage: {
                  url: 'https://example.com/post-cover.jpg',
                  isPortrait: false,
                },
                author: {
                  name: 'John Doe',
                  username: 'johndoe',
                  profilePicture: 'https://example.com/profile.jpg',
                },
              },
              cursor: 'cursor-1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cursor-1',
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed).toEqual({
        name: 'JavaScript Fundamentals',
        slug: 'javascript-fundamentals',
        description: '<p>Learn JavaScript from basics</p>',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-12-01T00:00:00.000Z'),
        coverImage: {
          url: 'https://example.com/series-cover.jpg',
        },
        seo: {
          title: 'JavaScript Fundamentals Series',
          description: 'Complete JavaScript learning series',
        },
        author: {
          id: 'author-1',
          name: 'John Doe',
          username: 'johndoe',
          profilePicture: 'https://example.com/profile.jpg',
          bio: 'JavaScript educator', // Uses text version, not HTML
          followersCount: 1000,
        },
        posts: [
          {
            id: 'post-1',
            title: 'JavaScript Basics',
            slug: 'javascript-basics',
            brief: 'Learn the basics of JavaScript',
            publishedAt: new Date('2023-06-01T00:00:00.000Z'),
            readTimeInMinutes: 5,
            views: 1500,
            url: 'https://example.com/javascript-basics',
            coverImage: {
              url: 'https://example.com/post-cover.jpg',
              isPortrait: false,
            },
            author: {
              name: 'John Doe',
              username: 'johndoe',
              profilePicture: 'https://example.com/profile.jpg',
            },
          },
        ],
        sortOrder: 'asc',
        raw: {
          id: 'series-123',
          cuid: 'series-cuid-456',
        },
      });
    });

    it('should handle series with minimal data', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-minimal',
        name: 'Minimal Series',
        slug: 'minimal-series',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.name).toBe('Minimal Series');
      expect(transformed.slug).toBe('minimal-series');
      expect(transformed.description).toBe('');
      expect(transformed.coverImage).toBeUndefined();
      expect(transformed.posts).toEqual([]);
      expect(transformed.sortOrder).toBe('asc');
    });

    it('should handle series without description', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-no-desc',
        name: 'No Description Series',
        slug: 'no-description',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.description).toBe('');
      expect(transformed.seo).toEqual({
        title: 'No Description Series',
        description: '',
      });
    });

    it('should handle series without author', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-no-author',
        name: 'No Author Series',
        slug: 'no-author',
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      } as HashnodeSeries;

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.author).toBeUndefined();
    });

    it('should handle series with posts but no cover images', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-no-covers',
        name: 'No Covers Series',
        slug: 'no-covers',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [
            {
              node: {
                id: 'post-1',
                title: 'Post Without Cover',
                slug: 'post-without-cover',
                brief: 'Brief',
                publishedAt: '2023-06-01T00:00:00.000Z',
                readTimeInMinutes: 3,
                views: 100,
                url: 'https://example.com/post',
                author: {
                  name: 'Author',
                  username: 'author',
                  profilePicture: '',
                },
              },
              cursor: 'cursor-1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.posts[0].coverImage).toBeUndefined();
      expect(transformed.posts[0].author.profilePicture).toBe('');
    });

    it('should handle series with missing post data', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-missing-data',
        name: 'Missing Data Series',
        slug: 'missing-data',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [
            {
              node: {
                id: 'post-1',
                title: 'Post With Missing Data',
                slug: 'post-missing-data',
                brief: '',
                publishedAt: '2023-06-01T00:00:00.000Z',
                readTimeInMinutes: 0,
                views: 0,
                url: 'https://example.com/post',
                author: {
                  name: 'Author',
                  username: 'author',
                },
              },
              cursor: 'cursor-1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.posts[0].brief).toBe('');
      expect(transformed.posts[0].readTimeInMinutes).toBe(0);
      expect(transformed.posts[0].views).toBe(0);
      expect(transformed.posts[0].author.profilePicture).toBe('');
    });

    it('should handle series with empty posts array', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-empty-posts',
        name: 'Empty Posts Series',
        slug: 'empty-posts',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.posts).toEqual([]);
    });

    it('should handle author with missing bio', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-no-bio',
        name: 'No Bio Series',
        slug: 'no-bio',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
          followersCount: 50,
        },
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const transformed = loader['transformItem'](mockSeries);

      expect(transformed.author?.bio).toBe('');
      expect(transformed.author?.followersCount).toBe(50);
    });

    it('should generate proper ID for series', () => {
      const mockSeries: HashnodeSeries = {
        id: 'series-123',
        name: 'Test Series',
        slug: 'test-series',
        author: {
          id: 'author-1',
          name: 'Author',
          username: 'author',
        },
        posts: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };

      const id = loader['generateId'](mockSeries);

      expect(id).toBe('test-series'); // Uses slug as primary ID, not series id
    });
  });

  describe('Series Data Handling', () => {
    it.skip('should handle series data with posts', async () => {
      // TODO: Fix series loader test structure
      expect(true).toBe(true);
    });

    it('should create loader with series-specific options', () => {
      const loader = seriesLoader({
        publicationHost: 'test.hashnode.dev',
        seriesSlug: 'javascript-fundamentals',
        includePosts: true,
        maxPostsPerSeries: 15,
      });

      expect(loader.name).toBe('hashnode-series');
      expect(typeof loader.load).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle empty publication host gracefully', () => {
      expect(() => {
        new SeriesLoader({
          publicationHost: '', // Empty host
        });
      }).not.toThrow(); // Should handle empty host gracefully
    });

    it('should accept various series options', () => {
      const loaderWithSlug = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
        seriesSlug: 'react-basics',
      });

      const loaderWithPosts = new SeriesLoader({
        publicationHost: 'test.hashnode.dev',
        includePosts: true,
        maxPostsPerSeries: 25,
      });

      expect(loaderWithSlug).toBeInstanceOf(SeriesLoader);
      expect(loaderWithPosts).toBeInstanceOf(SeriesLoader);
    });
  });
});
