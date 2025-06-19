/**
 * Content Transformation Utilities
 */
import { ProcessedContent } from '../types/loader-core.js';

/**
 * Extract plain text from HTML content
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return '';

  // Simple HTML tag removal (for basic use cases)
  // Note: For production use, consider using a proper HTML parser
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(
  content: string,
  maxLength: number = 160
): string {
  if (!content) return '';

  const text =
    typeof content === 'string' ? content : extractTextFromHtml(content);

  if (text.length <= maxLength) {
    return text;
  }

  // Find the last complete word within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > 0) {
    return `${truncated.substring(0, lastSpaceIndex)}...`;
  }

  return `${truncated}...`;
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 200
): number {
  if (!content) return 0;

  const text =
    typeof content === 'string' ? content : extractTextFromHtml(content);
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const minutes = Math.ceil(words.length / wordsPerMinute);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Count words in content
 */
export function countWords(content: string): number {
  if (!content) return 0;

  const text =
    typeof content === 'string' ? content : extractTextFromHtml(content);
  const words = text.split(/\s+/).filter(word => word.length > 0);

  return words.length;
}

/**
 * Clean and normalize content
 */
export function normalizeContent(content: string): string {
  if (!content) return '';

  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs
    .trim();
}

/**
 * Extract headings from HTML content
 */
export function extractHeadings(html: string): Array<{
  level: number;
  text: string;
  id?: string;
}> {
  if (!html) return [];

  const headings: Array<{ level: number; text: string; id?: string }> = [];
  const headingRegex =
    /<h([1-6])(?:\s+id=["']([^"']*?)["'])?[^>]*>(.*?)<\/h[1-6]>/gi;

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2] || undefined;
    const text = extractTextFromHtml(match[3]);

    if (text) {
      headings.push({ level, text, id });
    }
  }

  return headings;
}

/**
 * Generate table of contents from headings
 */
export function generateTableOfContents(
  headings: Array<{
    level: number;
    text: string;
    id?: string;
  }>
): Array<{
  level: number;
  title: string;
  slug: string;
  id: string;
  parentId?: string;
}> {
  if (!headings || headings.length === 0) return [];

  const toc: Array<{
    level: number;
    title: string;
    slug: string;
    id: string;
    parentId?: string;
  }> = [];

  const slugCounts = new Map<string, number>();

  headings.forEach((heading, index) => {
    // Generate slug from title
    let slug = heading.text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Handle duplicate slugs
    const count = slugCounts.get(slug) || 0;
    slugCounts.set(slug, count + 1);

    if (count > 0) {
      slug = `${slug}-${count}`;
    }

    // Find parent (previous heading with lower level)
    let parentId: string | undefined;
    for (let i = index - 1; i >= 0; i--) {
      if (toc[i] && toc[i].level < heading.level) {
        parentId = toc[i].id;
        break;
      }
    }

    toc.push({
      level: heading.level,
      title: heading.text,
      slug,
      id: heading.id || slug,
      parentId,
    });
  });

  return toc;
}

/**
 * Process content for display (combine multiple operations)
 */
export function processContent(
  html: string,
  options: {
    generateExcerpt?: boolean;
    excerptLength?: number;
    calculateReadingTime?: boolean;
    wordsPerMinute?: number;
    extractHeadings?: boolean;
    generateToc?: boolean;
  } = {}
): {
  html: string;
  text: string;
  excerpt?: string;
  readingTime?: number;
  wordCount: number;
  headings?: Array<{ level: number; text: string; id?: string }>;
  tableOfContents?: Array<{
    level: number;
    title: string;
    slug: string;
    id: string;
    parentId?: string;
  }>;
} {
  const {
    generateExcerpt: shouldGenerateExcerpt = false,
    excerptLength = 160,
    calculateReadingTime: shouldCalculateReadingTime = false,
    wordsPerMinute = 200,
    extractHeadings: shouldExtractHeadings = false,
    generateToc: shouldGenerateToc = false,
  } = options;

  const normalizedHtml = normalizeContent(html);
  const text = extractTextFromHtml(normalizedHtml);
  const wordCount = countWords(text);

  const result: ProcessedContent = {
    html: normalizedHtml,
    text,
    wordCount,
  };

  if (shouldGenerateExcerpt) {
    result.excerpt = generateExcerpt(text, excerptLength);
  }

  if (shouldCalculateReadingTime) {
    result.readingTime = calculateReadingTime(text, wordsPerMinute);
  }

  if (shouldExtractHeadings || shouldGenerateToc) {
    const headings = extractHeadings(normalizedHtml);

    if (shouldExtractHeadings) {
      result.headings = headings;
    }

    if (shouldGenerateToc) {
      result.tableOfContents = generateTableOfContents(headings);
    }
  }

  return result;
}
