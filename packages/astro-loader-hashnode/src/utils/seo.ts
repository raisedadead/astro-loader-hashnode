/**
 * SEO Utilities
 */
import { extractTextFromHtml, generateExcerpt } from './content.js';
import { JSONLDStructuredData } from '../types/loader-core.js';

/**
 * SEO metadata interface
 */
export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Generate SEO metadata from post data
 */
export function generateSEOMetadata(data: {
  title: string;
  subtitle?: string;
  brief?: string;
  content?: string;
  url?: string;
  canonicalUrl?: string;
  coverImage?: { url: string };
  author?: { name: string };
  publishedAt?: Date;
  updatedAt?: Date;
  tags?: Array<{ name: string }>;
  seo?: {
    title?: string;
    description?: string;
  };
}): SEOMetadata {
  const {
    title,
    subtitle,
    brief,
    content,
    url,
    canonicalUrl,
    coverImage,
    author,
    publishedAt,
    updatedAt,
    tags,
    seo,
  } = data;

  // Use explicit SEO data if provided, otherwise generate from content
  const seoTitle = seo?.title || optimizeTitle(title, subtitle);
  const seoDescription =
    seo?.description || generateMetaDescription(brief, content);

  const metadata: SEOMetadata = {
    title: seoTitle,
    description: seoDescription,
    canonical: canonicalUrl || url,

    // Open Graph
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogImage: coverImage?.url,
    ogType: 'article',

    // Twitter Card
    twitterCard: coverImage?.url ? 'summary_large_image' : 'summary',
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: coverImage?.url,

    // Article metadata
    author: author?.name,
    publishedTime: publishedAt?.toISOString(),
    modifiedTime: updatedAt?.toISOString(),
    section: 'blog',
    tags: tags?.map(tag => tag.name),
    keywords: generateKeywords(title, brief, content, tags),
  };

  return metadata;
}

/**
 * Optimize title for SEO (length and format)
 */
export function optimizeTitle(title: string, subtitle?: string): string {
  if (!title) return '';

  let optimizedTitle = title.trim();

  // Add subtitle if it exists and title is short enough
  if (subtitle && optimizedTitle.length + subtitle.length + 3 <= 60) {
    optimizedTitle = `${optimizedTitle} - ${subtitle}`;
  }

  // Ensure title is not too long for search results
  if (optimizedTitle.length > 60) {
    const truncated = optimizedTitle.substring(0, 57);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 30) {
      optimizedTitle = `${truncated.substring(0, lastSpaceIndex)}...`;
    } else {
      optimizedTitle = `${truncated}...`;
    }
  }

  return optimizedTitle;
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(
  brief?: string,
  content?: string
): string {
  // Use brief if available
  if (brief) {
    return generateExcerpt(brief, 160);
  }

  // Extract from content
  if (content) {
    const text = extractTextFromHtml(content);
    return generateExcerpt(text, 160);
  }

  return '';
}

/**
 * Generate keywords from content
 */
export function generateKeywords(
  title?: string,
  brief?: string,
  content?: string,
  tags?: Array<{ name: string }>
): string[] {
  const keywords = new Set<string>();

  // Add tags as primary keywords
  if (tags) {
    tags.forEach(tag => {
      keywords.add(tag.name.toLowerCase());
    });
  }

  // Extract keywords from title
  if (title) {
    const titleWords = extractImportantWords(title);
    titleWords.forEach(word => keywords.add(word));
  }

  // Extract keywords from brief
  if (brief) {
    const briefWords = extractImportantWords(brief);
    briefWords.slice(0, 3).forEach(word => keywords.add(word)); // Limit to top 3
  }

  // Extract keywords from content (limited)
  if (content && keywords.size < 10) {
    const text = extractTextFromHtml(content);
    const contentWords = extractImportantWords(text);
    contentWords.slice(0, 5).forEach(word => keywords.add(word)); // Limit to top 5
  }

  return Array.from(keywords).slice(0, 10); // Limit total keywords
}

/**
 * Extract important words from text (simple keyword extraction)
 */
function extractImportantWords(text: string): string[] {
  if (!text) return [];

  // Common stop words to exclude
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'up',
    'about',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'out',
    'off',
    'over',
    'under',
    'again',
    'further',
    'then',
    'once',
    'here',
    'there',
    'when',
    'where',
    'why',
    'how',
    'all',
    'any',
    'both',
    'each',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'not',
    'only',
    'own',
    'same',
    'so',
    'than',
    'too',
    'very',
    'can',
    'will',
    'just',
    'should',
    'now',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'me',
    'him',
    'her',
    'us',
    'them',
    'my',
    'your',
    'his',
    'its',
    'our',
    'their',
  ]);

  // Extract words and count frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  // Sort by frequency and return top words
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
    .map(([word]) => word)
    .slice(0, 10); // Return top 10
}

/**
 * Generate JSON-LD structured data for blog post
 */
export function generateJSONLD(data: {
  title: string;
  description: string;
  url: string;
  coverImage?: { url: string };
  author: { name: string; url?: string };
  publishedAt: Date;
  updatedAt?: Date;
  organization?: {
    name: string;
    url: string;
    logo?: string;
  };
}): object {
  const {
    title,
    description,
    url,
    coverImage,
    author,
    publishedAt,
    updatedAt,
    organization,
  } = data;

  const structuredData: JSONLDStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: publishedAt.toISOString(),
    dateModified: (updatedAt || publishedAt).toISOString(),
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    ...(coverImage && {
      image: {
        '@type': 'ImageObject',
        url: coverImage.url,
      },
    }),
  };

  if (organization) {
    structuredData.publisher = {
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
      ...(organization.logo && {
        logo: {
          '@type': 'ImageObject',
          url: organization.logo,
        },
      }),
    };
  }

  return structuredData;
}

/**
 * Validate SEO metadata
 */
export function validateSEOMetadata(metadata: SEOMetadata): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required fields
  if (!metadata.title) {
    errors.push('Title is required');
  } else if (metadata.title.length > 60) {
    warnings.push('Title is longer than 60 characters');
  } else if (metadata.title.length < 10) {
    warnings.push('Title is shorter than 10 characters');
  }

  if (!metadata.description) {
    errors.push('Description is required');
  } else if (metadata.description.length > 160) {
    warnings.push('Description is longer than 160 characters');
  } else if (metadata.description.length < 50) {
    warnings.push('Description is shorter than 50 characters');
  }

  // Optional but recommended fields
  if (!metadata.ogImage) {
    warnings.push('Open Graph image is missing');
  }

  if (!metadata.canonical) {
    warnings.push('Canonical URL is missing');
  }

  if (!metadata.keywords || metadata.keywords.length === 0) {
    warnings.push('Keywords are missing');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
