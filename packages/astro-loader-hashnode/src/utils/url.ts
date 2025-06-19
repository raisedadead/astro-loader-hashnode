/**
 * URL Utilities
 */
import { URL, URLSearchParams } from 'url';
import { SitemapEntry } from '../types/loader-core.js';

/**
 * Generate a URL-friendly slug from text
 */
export function createSlug(text: string): string {
  if (!text) return '';

  return (
    text
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[\s\W-]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Limit length
      .substring(0, 100)
  );
}

/**
 * Ensure URL has proper protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  // If URL already has protocol, return as-is
  if (url.match(/^https?:\/\//)) {
    return url;
  }

  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // If URL starts with /, it's a relative path
  if (url.startsWith('/')) {
    return url;
  }

  // Otherwise, assume it needs https://
  return `https://${url}`;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  if (!url) return '';

  try {
    const urlObj = new URL(normalizeUrl(url));
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate absolute URL from relative path
 */
export function makeAbsoluteUrl(path: string, baseUrl: string): string {
  if (!path) return baseUrl;
  if (!baseUrl) return path;

  // If path is already absolute, return as-is
  if (isValidUrl(path)) {
    return path;
  }

  try {
    const base = new URL(normalizeUrl(baseUrl));
    const absolute = new URL(path, base);
    return absolute.toString();
  } catch {
    return path;
  }
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  if (!baseUrl) return '';

  try {
    const url = new URL(normalizeUrl(baseUrl));

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Parse URL and extract components
 */
export function parseUrl(url: string): {
  protocol: string;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  searchParams: URLSearchParams;
} | null {
  if (!url) return null;

  try {
    const urlObj = new URL(normalizeUrl(url));
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      searchParams: urlObj.searchParams,
    };
  } catch {
    return null;
  }
}

/**
 * Clean URL by removing tracking parameters
 */
export function cleanUrl(url: string, paramsToRemove: string[] = []): string {
  if (!url) return '';

  const defaultParamsToRemove = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',
    'gclid',
    'fbclid',
    'msclkid',
    'ref',
    'source',
    '_ga',
    '_gl',
    'mc_cid',
    'mc_eid',
  ];

  const allParamsToRemove = [...defaultParamsToRemove, ...paramsToRemove];

  try {
    const urlObj = new URL(normalizeUrl(url));

    allParamsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Generate social media sharing URLs
 */
export function generateSharingUrls(data: {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string;
}): {
  twitter: string;
  facebook: string;
  linkedin: string;
  reddit: string;
  email: string;
} {
  const { url, title, description = '', hashtags = [], via = '' } = data;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  return {
    twitter: buildUrl('https://twitter.com/intent/tweet', {
      url: encodedUrl,
      text: encodedTitle,
      hashtags: hashtags.join(','),
      via,
    }),

    facebook: buildUrl('https://www.facebook.com/sharer/sharer.php', {
      u: encodedUrl,
    }),

    linkedin: buildUrl('https://www.linkedin.com/sharing/share-offsite/', {
      url: encodedUrl,
    }),

    reddit: buildUrl('https://www.reddit.com/submit', {
      url: encodedUrl,
      title: encodedTitle,
    }),

    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0D%0A%0D%0A${encodedUrl}`,
  };
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(
  slug: string,
  baseUrl: string,
  options: {
    pathPrefix?: string;
    removeTrailingSlash?: boolean;
  } = {}
): string {
  const { pathPrefix = '', removeTrailingSlash = true } = options;

  if (!slug || !baseUrl) return '';

  try {
    const base = new URL(normalizeUrl(baseUrl));
    const path = [pathPrefix, slug].filter(Boolean).join('/');

    let canonicalUrl = `${base.origin}/${path}`;

    if (removeTrailingSlash && canonicalUrl.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
    }

    return canonicalUrl;
  } catch {
    return '';
  }
}

/**
 * Extract slug from URL
 */
export function extractSlugFromUrl(url: string): string {
  if (!url) return '';

  try {
    const urlObj = new URL(normalizeUrl(url));
    const pathname = urlObj.pathname;

    // Get the last segment of the path
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  } catch {
    return '';
  }
}

/**
 * Check if URL is from the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  if (!url1 || !url2) return false;

  try {
    const domain1 = new URL(normalizeUrl(url1)).hostname;
    const domain2 = new URL(normalizeUrl(url2)).hostname;
    return domain1 === domain2;
  } catch {
    return false;
  }
}

/**
 * Generate sitemap URL entries
 */
export function generateSitemapEntry(data: {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
}): {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
} {
  const { url, lastModified, changeFrequency, priority } = data;

  const entry: SitemapEntry = {
    loc: cleanUrl(url),
  };

  if (lastModified) {
    entry.lastmod = lastModified.toISOString().split('T')[0];
  }

  if (changeFrequency) {
    entry.changefreq = changeFrequency;
  }

  if (priority !== undefined && priority >= 0 && priority <= 1) {
    entry.priority = priority.toFixed(1);
  }

  return entry;
}
