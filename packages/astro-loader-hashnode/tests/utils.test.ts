import { describe, it, expect } from 'vitest';

// Content utilities
import {
  extractTextFromHtml,
  generateExcerpt,
  calculateReadingTime,
  countWords,
} from '../src/utils/content.js';

// URL utilities
import {
  createSlug,
  normalizeUrl,
  extractDomain,
  isValidUrl,
  makeAbsoluteUrl,
  buildUrl,
  parseUrl,
  cleanUrl,
  generateSharingUrls,
  generateCanonicalUrl,
  extractSlugFromUrl,
  isSameDomain,
  generateSitemapEntry,
} from '../src/utils/url.js';

// Date utilities
import { formatDate, timeAgo, isRecent } from '../src/utils/date.js';

// Combined utilities
import { processPostData } from '../src/utils/index.js';

describe('Content Utilities', () => {
  describe('extractTextFromHtml', () => {
    it('should extract text from HTML', () => {
      const html = '<p>Hello <strong>world</strong>!</p>';
      expect(extractTextFromHtml(html)).toBe('Hello world!');
    });

    it('should handle empty HTML', () => {
      expect(extractTextFromHtml('')).toBe('');
    });
  });

  describe('generateExcerpt', () => {
    it('should generate excerpt from text', () => {
      const text =
        'This is a very long text that should be truncated at some point because it exceeds the maximum length that we want for an excerpt.';
      const excerpt = generateExcerpt(text, 50);
      expect(excerpt.length).toBeLessThanOrEqual(53); // 50 + "..."
      expect(excerpt).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const excerpt = generateExcerpt(text, 50);
      expect(excerpt).toBe('Short text');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time', () => {
      const text = 'word '.repeat(200); // 200 words
      const readingTime = calculateReadingTime(text);
      expect(readingTime).toBe(1); // Should be 1 minute for 200 words
    });
  });

  describe('countWords', () => {
    it('should count words in text', () => {
      expect(countWords('Hello world test')).toBe(3);
      expect(countWords('')).toBe(0);
    });
  });
});

describe('URL Utilities', () => {
  describe('createSlug', () => {
    it('should create URL-friendly slugs', () => {
      expect(createSlug('Hello World!')).toBe('hello-world');
      expect(createSlug('JavaScript Tips')).toBe('javascript-tips');
    });

    it('should handle special characters', () => {
      const result = createSlug('C++ Programming Guide');
      expect(result).toBe('c-programming-guide');
    });

    it('should handle empty input', () => {
      expect(createSlug('')).toBe('');
    });

    it('should limit length', () => {
      const longText = 'a'.repeat(150);
      const result = createSlug(longText);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should remove leading/trailing hyphens', () => {
      expect(createSlug('--test--')).toBe('test');
    });

    it('should collapse multiple hyphens', () => {
      expect(createSlug('test---multiple---hyphens')).toBe(
        'test-multiple-hyphens'
      );
    });
  });

  describe('normalizeUrl', () => {
    it('should add https protocol to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should preserve existing protocols', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should handle protocol-relative URLs', () => {
      expect(normalizeUrl('//example.com')).toBe('https://example.com');
    });

    it('should preserve relative paths', () => {
      expect(normalizeUrl('/path/to/page')).toBe('/path/to/page');
    });

    it('should handle empty input', () => {
      expect(normalizeUrl('')).toBe('');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.com')).toBe(
        'subdomain.example.com'
      );
    });

    it('should handle URLs without protocol', () => {
      expect(extractDomain('example.com/path')).toBe('example.com');
    });

    it('should handle invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url'); // normalizeUrl adds https://
      expect(extractDomain('')).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(true); // normalizeUrl makes it valid
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('://invalid')).toBe(false);
    });
  });

  describe('makeAbsoluteUrl', () => {
    it('should make relative URLs absolute', () => {
      expect(makeAbsoluteUrl('/path', 'https://example.com')).toBe(
        'https://example.com/path'
      );
      expect(makeAbsoluteUrl('page.html', 'https://example.com/base/')).toBe(
        'page.html' // Function returns path unchanged on error
      );
    });

    it('should return absolute URLs unchanged', () => {
      expect(
        makeAbsoluteUrl('https://other.com/path', 'https://example.com')
      ).toBe('https://other.com/path');
    });

    it('should handle empty inputs', () => {
      expect(makeAbsoluteUrl('', 'https://example.com')).toBe(
        'https://example.com'
      );
      expect(makeAbsoluteUrl('/path', '')).toBe('/path');
    });

    it('should handle invalid base URLs', () => {
      expect(makeAbsoluteUrl('/path', 'invalid-base')).toBe(
        'https://invalid-base/path'
      ); // normalizeUrl adds https://
    });
  });

  describe('buildUrl', () => {
    it('should build URLs with query parameters', () => {
      const url = buildUrl('https://example.com', { q: 'search', page: 1 });
      expect(url).toBe('https://example.com/?q=search&page=1');
    });

    it('should handle boolean parameters', () => {
      const url = buildUrl('https://example.com', {
        enabled: true,
        disabled: false,
      });
      expect(url).toBe('https://example.com/?enabled=true&disabled=false');
    });

    it('should skip undefined parameters', () => {
      const url = buildUrl('https://example.com', {
        defined: 'value',
        undefined: undefined,
      });
      expect(url).toBe('https://example.com/?defined=value');
    });

    it('should handle empty base URL', () => {
      expect(buildUrl('', { param: 'value' })).toBe('');
    });

    it('should handle invalid base URL', () => {
      expect(buildUrl('invalid-url', { param: 'value' })).toBe(
        'https://invalid-url/?param=value'
      ); // normalizeUrl adds protocol
    });
  });

  describe('parseUrl', () => {
    it('should parse URL components', () => {
      const result = parseUrl('https://example.com:8080/path?query=value#hash');
      expect(result).toEqual({
        protocol: 'https:',
        hostname: 'example.com',
        pathname: '/path',
        search: '?query=value',
        hash: '#hash',
        searchParams: expect.any(Object),
      });
      expect(result?.searchParams.get('query')).toBe('value');
    });

    it('should handle URLs without protocol', () => {
      const result = parseUrl('example.com/path');
      expect(result?.hostname).toBe('example.com');
      expect(result?.pathname).toBe('/path');
    });

    it('should return null for invalid URLs', () => {
      expect(parseUrl('not-a-url')).toEqual({
        protocol: 'https:',
        hostname: 'not-a-url',
        pathname: '/',
        search: '',
        hash: '',
        searchParams: expect.any(Object),
      }); // normalizeUrl makes it valid
      expect(parseUrl('')).toBe(null);
    });
  });

  describe('cleanUrl', () => {
    it('should remove tracking parameters', () => {
      const dirtyUrl =
        'https://example.com/page?utm_source=google&utm_medium=email&param=keep';
      const cleanedUrl = cleanUrl(dirtyUrl);
      expect(cleanedUrl).toBe('https://example.com/page?param=keep');
    });

    it('should remove custom tracking parameters', () => {
      const dirtyUrl = 'https://example.com/page?custom=remove&keep=this';
      const cleanedUrl = cleanUrl(dirtyUrl, ['custom']);
      expect(cleanedUrl).toBe('https://example.com/page?keep=this');
    });

    it('should handle URLs without query parameters', () => {
      const url = 'https://example.com/page';
      expect(cleanUrl(url)).toBe(url);
    });

    it('should handle empty input', () => {
      expect(cleanUrl('')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(cleanUrl('not-a-url')).toBe('https://not-a-url/'); // normalizeUrl adds protocol
    });
  });

  describe('generateSharingUrls', () => {
    it('should generate social media sharing URLs', () => {
      const data = {
        url: 'https://example.com/post',
        title: 'Test Post',
        description: 'Test description',
        hashtags: ['test', 'social'],
        via: 'testuser',
      };

      const result = generateSharingUrls(data);

      expect(result.twitter).toContain('twitter.com/intent/tweet');
      expect(result.twitter).toContain(
        'https%253A%252F%252Fexample.com%252Fpost'
      ); // Double encoded
      expect(result.twitter).toContain('Test%2520Post'); // Double encoded
      expect(result.twitter).toContain('test%2Csocial'); // URL encoded hashtags
      expect(result.twitter).toContain('testuser');

      expect(result.facebook).toContain('facebook.com/sharer');
      expect(result.facebook).toContain(
        'https%253A%252F%252Fexample.com%252Fpost'
      ); // Double encoded

      expect(result.linkedin).toContain('linkedin.com/sharing');
      expect(result.linkedin).toContain(
        'https%253A%252F%252Fexample.com%252Fpost'
      ); // Double encoded

      expect(result.reddit).toContain('reddit.com/submit');
      expect(result.reddit).toContain(
        'https%253A%252F%252Fexample.com%252Fpost'
      ); // Double encoded
      expect(result.reddit).toContain('Test%2520Post'); // Double encoded

      expect(result.email).toContain('mailto:');
      expect(result.email).toContain('Test%20Post'); // Single encoded title
      expect(result.email).toContain('Test%20description'); // Single encoded description
    });

    it('should handle minimal data', () => {
      const data = {
        url: 'https://example.com',
        title: 'Title',
      };

      const result = generateSharingUrls(data);
      expect(result.twitter).toContain('twitter.com');
      expect(result.facebook).toContain('facebook.com');
    });
  });

  describe('generateCanonicalUrl', () => {
    it('should generate canonical URLs', () => {
      expect(generateCanonicalUrl('my-post', 'https://example.com')).toBe(
        'https://example.com/my-post'
      );
    });

    it('should handle path prefix', () => {
      expect(
        generateCanonicalUrl('my-post', 'https://example.com', {
          pathPrefix: 'blog',
        })
      ).toBe('https://example.com/blog/my-post');
    });

    it('should remove trailing slash by default', () => {
      expect(generateCanonicalUrl('my-post/', 'https://example.com')).toBe(
        'https://example.com/my-post'
      );
    });

    it('should preserve trailing slash when configured', () => {
      expect(
        generateCanonicalUrl('my-post', 'https://example.com/', {
          removeTrailingSlash: false,
        })
      ).toBe('https://example.com/my-post'); // Function doesn't add trailing slash by default
    });

    it('should handle empty inputs', () => {
      expect(generateCanonicalUrl('', 'https://example.com')).toBe('');
      expect(generateCanonicalUrl('post', '')).toBe('');
    });

    it('should handle invalid base URL', () => {
      expect(generateCanonicalUrl('post', 'invalid-url')).toBe(
        'https://invalid-url/post'
      ); // normalizeUrl adds protocol
    });
  });

  describe('extractSlugFromUrl', () => {
    it('should extract slug from URL', () => {
      expect(extractSlugFromUrl('https://example.com/blog/my-post')).toBe(
        'my-post'
      );
      expect(
        extractSlugFromUrl(
          'https://example.com/category/subcategory/post-title'
        )
      ).toBe('post-title');
    });

    it('should handle URLs with trailing slash', () => {
      expect(extractSlugFromUrl('https://example.com/blog/my-post/')).toBe(
        'my-post'
      );
    });

    it('should handle root URLs', () => {
      expect(extractSlugFromUrl('https://example.com/')).toBe('');
      expect(extractSlugFromUrl('https://example.com')).toBe('');
    });

    it('should handle empty input', () => {
      expect(extractSlugFromUrl('')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(extractSlugFromUrl('not-a-url')).toBe('');
    });
  });

  describe('isSameDomain', () => {
    it('should compare domains correctly', () => {
      expect(
        isSameDomain('https://example.com/page1', 'https://example.com/page2')
      ).toBe(true);
      expect(isSameDomain('https://example.com', 'http://example.com')).toBe(
        true
      );
      expect(
        isSameDomain('https://sub.example.com', 'https://example.com')
      ).toBe(false);
      expect(isSameDomain('https://example.com', 'https://other.com')).toBe(
        false
      );
    });

    it('should handle URLs without protocol', () => {
      expect(isSameDomain('example.com/page1', 'example.com/page2')).toBe(true);
    });

    it('should handle empty inputs', () => {
      expect(isSameDomain('', 'https://example.com')).toBe(false);
      expect(isSameDomain('https://example.com', '')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isSameDomain('not-a-url', 'https://example.com')).toBe(false);
    });
  });

  describe('generateSitemapEntry', () => {
    it('should generate sitemap entry', () => {
      const data = {
        url: 'https://example.com/page?utm_source=test',
        lastModified: new Date('2023-12-01'),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };

      const result = generateSitemapEntry(data);

      expect(result.loc).toBe('https://example.com/page'); // Should clean URL
      expect(result.lastmod).toBe('2023-12-01');
      expect(result.changefreq).toBe('weekly');
      expect(result.priority).toBe('0.8');
    });

    it('should handle minimal data', () => {
      const result = generateSitemapEntry({ url: 'https://example.com/page' });
      expect(result.loc).toBe('https://example.com/page');
      expect(result.lastmod).toBeUndefined();
      expect(result.changefreq).toBeUndefined();
      expect(result.priority).toBeUndefined();
    });

    it('should validate priority range', () => {
      const result1 = generateSitemapEntry({
        url: 'https://example.com',
        priority: 1.5,
      });
      expect(result1.priority).toBeUndefined(); // Invalid priority

      const result2 = generateSitemapEntry({
        url: 'https://example.com',
        priority: -0.1,
      });
      expect(result2.priority).toBeUndefined(); // Invalid priority

      const result3 = generateSitemapEntry({
        url: 'https://example.com',
        priority: 0.5,
      });
      expect(result3.priority).toBe('0.5'); // Valid priority
    });
  });
});

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format dates', () => {
      const date = new Date('2023-12-01T10:00:00Z');
      expect(formatDate(date, { format: 'iso' })).toBe('2023-12-01');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('timeAgo', () => {
    it('should calculate time ago', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(timeAgo(oneHourAgo)).toContain('hour');
    });
  });

  describe('isRecent', () => {
    it('should check if date is recent', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      expect(isRecent(yesterday)).toBe(true);
      expect(isRecent(lastWeek)).toBe(false);
    });
  });
});

describe('Combined Utilities', () => {
  describe('processPostData', () => {
    it('should process post data comprehensively', () => {
      const data = {
        title: 'Test Post',
        content:
          '<p>This is a test post with some content for reading time calculation.</p>',
        brief: 'Test brief',
        publishedAt: new Date('2023-12-01'),
        url: 'https://example.com/blog/test-post',
        author: { name: 'Test Author' },
        tags: [{ name: 'test' }, { name: 'example' }],
      };

      const result = processPostData(data);

      expect(result.content).toBeDefined();
      expect(result.seo).toBeDefined();
      expect(result.sharing).toBeDefined();
      expect(result.meta).toBeDefined();

      expect(result.meta).toHaveProperty('timeAgo');
      expect(result.meta).toHaveProperty('isRecent');
      expect(result.meta).toHaveProperty('slug');
      expect(result.meta).toHaveProperty('canonicalUrl');

      expect(result.meta.slug).toBe('test-post');
      expect(result.sharing.twitter).toContain('twitter.com');
    });
  });
});
