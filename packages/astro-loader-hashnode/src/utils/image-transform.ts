/**
 * Image transformation utilities
 *
 * Handles transformation of Hashnode CDN image URLs to custom CDN/service URLs
 */

import type {
  ImageTransformFn,
  ImageTransformContext,
} from '../types/loader.js';

/**
 * Check if URL is from Hashnode CDN
 */
export function isHashnodeImageUrl(url: string): boolean {
  return url.includes('cdn.hashnode.com');
}

/**
 * Transform images in HTML content
 *
 * @param html - HTML content with image tags
 * @param transformFn - Image transformation function
 * @param postContext - Context about the post
 * @returns HTML with transformed image URLs
 */
export async function transformHtmlImages(
  html: string,
  transformFn: ImageTransformFn,
  postContext: { id: string; title: string }
): Promise<string> {
  // Match img tags with src attribute
  const imgRegex = /<img([^>]+)src="([^"]+)"([^>]*)>/g;

  const matches = Array.from(html.matchAll(imgRegex));
  let transformedHtml = html;

  // Process each image sequentially to handle async transforms
  for (const match of matches) {
    const fullMatch = match[0];
    const beforeSrc = match[1];
    const originalUrl = match[2];
    const afterSrc = match[3];

    // Only transform Hashnode CDN images
    if (!isHashnodeImageUrl(originalUrl)) {
      continue;
    }

    try {
      const context: ImageTransformContext = {
        type: 'inline',
        postId: postContext.id,
        postTitle: postContext.title,
        originalUrl,
      };

      const newUrl = await transformFn(originalUrl, context);

      // Replace the full img tag with transformed URL
      const newImgTag = `<img${beforeSrc}src="${newUrl}"${afterSrc}>`;
      transformedHtml = transformedHtml.replace(fullMatch, newImgTag);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to transform image URL "${originalUrl}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return transformedHtml;
}

/**
 * Transform a single cover image URL
 *
 * @param url - Original image URL
 * @param transformFn - Image transformation function
 * @param postContext - Context about the post
 * @returns Transformed URL or original if transformation fails
 */
export async function transformCoverImage(
  url: string,
  transformFn: ImageTransformFn,
  postContext: { id: string; title: string }
): Promise<string> {
  // Only transform Hashnode CDN images
  if (!isHashnodeImageUrl(url)) {
    return url;
  }

  try {
    const context: ImageTransformContext = {
      type: 'cover',
      postId: postContext.id,
      postTitle: postContext.title,
      originalUrl: url,
    };

    return await transformFn(url, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Failed to transform cover image URL "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return url;
  }
}

/**
 * Transform images in post data (both cover and inline)
 *
 * @param post - Post data with images
 * @param transformFn - Image transformation function
 * @returns Post data with transformed image URLs
 */
export async function transformPostImages<
  T extends {
    id: string;
    title: string;
    coverImage?: { url: string };
    content?: { html?: string };
  },
>(post: T, transformFn: ImageTransformFn): Promise<T> {
  const postContext = {
    id: post.id,
    title: post.title,
  };

  // Transform cover image
  if (post.coverImage?.url) {
    post.coverImage.url = await transformCoverImage(
      post.coverImage.url,
      transformFn,
      postContext
    );
  }

  // Transform inline images in HTML
  if (post.content?.html) {
    post.content.html = await transformHtmlImages(
      post.content.html,
      transformFn,
      postContext
    );
  }

  return post;
}
