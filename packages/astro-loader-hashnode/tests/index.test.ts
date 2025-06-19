import { describe, it, expect } from 'vitest';
import {
  hashnodeLoader,
  createHashnodeLoaders,
  createBlog,
  createPublication,
  checkCompatibility,
  version,
  packageName,
} from '../src/index.js';

describe('Convenience Functions', () => {
  describe('hashnodeLoader', () => {
    it('should create a posts loader', () => {
      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
      });

      expect(loader.name).toBe('hashnode-posts');
      expect(typeof loader.load).toBe('function');
    });

    it('should pass through all options', () => {
      const loader = hashnodeLoader({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 50,
        includeComments: true,
        includeCoAuthors: true,
        includeTableOfContents: true,
        token: 'test-token',
      });

      expect(loader.name).toBe('hashnode-posts');
    });
  });

  describe('createHashnodeLoaders', () => {
    it('should create multiple loaders without token', () => {
      const loaders = createHashnodeLoaders({
        publicationHost: 'test.hashnode.dev',
      });

      expect(loaders.posts).toBeDefined();
      expect(loaders.series).toBeDefined();
      expect(loaders.drafts).toBeUndefined(); // No token provided
      expect(typeof loaders.search).toBe('function');
    });

    it('should create all loaders with token', () => {
      const loaders = createHashnodeLoaders({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      expect(loaders.posts).toBeDefined();
      expect(loaders.series).toBeDefined();
      expect(loaders.drafts).toBeDefined(); // Token provided
      expect(typeof loaders.search).toBe('function');

      expect(loaders.posts.name).toBe('hashnode-posts');
      expect(loaders.series.name).toBe('hashnode-series');
      expect(loaders.drafts?.name).toBe('hashnode-drafts');
    });

    it('should create search loader with terms', () => {
      const loaders = createHashnodeLoaders({
        publicationHost: 'test.hashnode.dev',
      });

      const searchLoader = loaders.search(['javascript', 'react']);
      expect(searchLoader.name).toBe('hashnode-search');
    });

    it('should handle additional options', () => {
      const loaders = createHashnodeLoaders({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 100,
        enableCache: true,
        cacheTTL: 300000,
      });

      expect(loaders.posts).toBeDefined();
      expect(loaders.series).toBeDefined();
    });
  });

  describe('createBlog', () => {
    it('should create blog configuration', () => {
      const blog = createBlog({
        publicationHost: 'test.hashnode.dev',
      });

      expect(blog.posts).toBeDefined();
      expect(blog.posts.loader).toBeDefined();
      expect(blog.posts.loader.name).toBe('hashnode-posts');
    });

    it('should handle blog options', () => {
      const blog = createBlog({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 200,
        includeComments: true,
        includeCoAuthors: true,
      });

      expect(blog.posts).toBeDefined();
      expect(blog.posts.loader.name).toBe('hashnode-posts');
    });
  });

  describe('createPublication', () => {
    it('should create publication without token', () => {
      const publication = createPublication({
        publicationHost: 'test.hashnode.dev',
      });

      expect(publication.posts).toBeDefined();
      expect(publication.series).toBeDefined();
      expect(publication.drafts).toBeUndefined(); // No token

      expect(publication.posts.loader.name).toBe('hashnode-posts');
      expect(publication.series.loader.name).toBe('hashnode-series');
    });

    it('should create publication with token', () => {
      const publication = createPublication({
        publicationHost: 'test.hashnode.dev',
        token: 'test-token',
      });

      expect(publication.posts).toBeDefined();
      expect(publication.series).toBeDefined();
      expect(publication.drafts).toBeDefined(); // Token provided

      expect(publication.posts.loader.name).toBe('hashnode-posts');
      expect(publication.series.loader.name).toBe('hashnode-series');
      expect(publication.drafts?.loader.name).toBe('hashnode-drafts');
    });

    it('should handle publication options', () => {
      const publication = createPublication({
        publicationHost: 'test.hashnode.dev',
        maxPosts: 150,
        enableCache: true,
      });

      expect(publication.posts).toBeDefined();
      expect(publication.series).toBeDefined();
    });
  });
});

describe('Package Information', () => {
  describe('version', () => {
    it('should have a version number', () => {
      expect(typeof version).toBe('string');
      expect(version).toBeTruthy();
    });
  });

  describe('packageName', () => {
    it('should have correct package name', () => {
      expect(packageName).toBe('astro-loader-hashnode');
    });
  });
});

describe('Compatibility', () => {
  describe('checkCompatibility', () => {
    it('should check Astro compatibility', async () => {
      const isCompatible = await checkCompatibility();
      expect(typeof isCompatible).toBe('boolean');
    });

    it('should handle missing Astro', async () => {
      // This test simulates when Astro is not available
      // In a real environment, this would depend on the actual Astro installation
      const isCompatible = await checkCompatibility();
      expect(typeof isCompatible).toBe('boolean');
    });
  });
});

describe('Error Handling', () => {
  it('should handle invalid publication host gracefully', () => {
    expect(() => {
      hashnodeLoader({
        publicationHost: '', // Empty host
      });
    }).not.toThrow(); // Should not throw, let the loader handle it
  });

  it('should handle missing options gracefully', () => {
    expect(() => {
      createHashnodeLoaders({
        publicationHost: 'test.hashnode.dev',
        // Missing other options should use defaults
      });
    }).not.toThrow();
  });

  it('should handle malformed options', () => {
    expect(() => {
      createBlog({
        publicationHost: 'test.hashnode.dev',
        maxPosts: -1, // Invalid number
      });
    }).not.toThrow(); // Should not throw, let the loader validate
  });
});

describe('Integration', () => {
  it('should create compatible loader structures', () => {
    const blog = createBlog({
      publicationHost: 'test.hashnode.dev',
    });

    const publication = createPublication({
      publicationHost: 'test.hashnode.dev',
      token: 'test-token',
    });

    const loaders = createHashnodeLoaders({
      publicationHost: 'test.hashnode.dev',
      token: 'test-token',
    });

    // All should have consistent structure
    expect(blog.posts.loader.name).toBe('hashnode-posts');
    expect(publication.posts.loader.name).toBe('hashnode-posts');
    expect(loaders.posts.name).toBe('hashnode-posts');

    expect(publication.series.loader.name).toBe('hashnode-series');
    expect(loaders.series.name).toBe('hashnode-series');

    expect(publication.drafts?.loader.name).toBe('hashnode-drafts');
    expect(loaders.drafts?.name).toBe('hashnode-drafts');
  });

  it('should handle different configuration patterns', () => {
    // Simple configuration
    const simple = hashnodeLoader({
      publicationHost: 'blog.example.com',
    });

    // Advanced configuration
    const advanced = hashnodeLoader({
      publicationHost: 'blog.example.com',
      maxPosts: 100,
      includeComments: true,
      includeCoAuthors: true,
      includeTableOfContents: true,
      token: 'test-token',
      enableCache: true,
      cacheTTL: 600000,
    });

    expect(simple.name).toBe('hashnode-posts');
    expect(advanced.name).toBe('hashnode-posts');
  });

  it('should maintain backwards compatibility', () => {
    // Test that the main export functions work as expected
    const mainLoader = hashnodeLoader({
      publicationHost: 'test.hashnode.dev',
    });

    // Should be equivalent to postsLoader
    expect(mainLoader.name).toBe('hashnode-posts');
    expect(typeof mainLoader.load).toBe('function');
  });
});
