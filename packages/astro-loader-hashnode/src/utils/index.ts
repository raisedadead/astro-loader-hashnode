/**
 * Utilities - Export all utility functions
 */

// Content utilities
export {
  extractTextFromHtml,
  generateExcerpt,
  calculateReadingTime,
  countWords,
  normalizeContent,
  extractHeadings,
  generateTableOfContents,
  processContent,
} from './content.js';

// SEO utilities
export {
  generateSEOMetadata,
  optimizeTitle,
  generateMetaDescription,
  generateKeywords,
  generateJSONLD,
  validateSEOMetadata,
} from './seo.js';
export type { SEOMetadata } from './seo.js';

// Date utilities
export { formatDate, timeAgo, isRecent } from './date.js';

// URL utilities
export {
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
} from './url.js';

// Import for internal use
import { processContent } from './content.js';
import { generateSEOMetadata } from './seo.js';
import {
  generateSharingUrls,
  extractSlugFromUrl,
  generateCanonicalUrl,
} from './url.js';
import { timeAgo, isRecent } from './date.js';

// Combined utility functions for common use cases
export function processPostData(data: {
  title: string;
  content: string;
  brief?: string;
  publishedAt: Date;
  url: string;
  author: { name: string };
  tags?: Array<{ name: string }>;
}) {
  const { title, content, brief, publishedAt, url, author, tags } = data;

  // Process content
  const contentData = processContent(content, {
    generateExcerpt: !brief,
    calculateReadingTime: true,
    extractHeadings: true,
    generateToc: true,
  });

  // Generate SEO metadata
  const seoData = generateSEOMetadata({
    title,
    brief: brief || contentData.excerpt || '',
    content,
    url,
    author,
    publishedAt,
    tags,
  });

  // Generate sharing URLs
  const sharingUrls = generateSharingUrls({
    url,
    title,
    description: brief || contentData.excerpt || '',
    hashtags: tags?.map(tag => tag.name) || [],
  });

  return {
    content: contentData,
    seo: seoData,
    sharing: sharingUrls,
    meta: {
      timeAgo: timeAgo(publishedAt),
      isRecent: isRecent(publishedAt),
      slug: extractSlugFromUrl(url),
      canonicalUrl: generateCanonicalUrl(extractSlugFromUrl(url), url),
    },
  };
}
