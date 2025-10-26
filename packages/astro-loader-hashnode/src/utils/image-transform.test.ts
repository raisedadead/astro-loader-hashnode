/**
 * Tests for image transformation utilities
 */
import { describe, it, expect, vi } from 'vitest';
import {
  isHashnodeImageUrl,
  transformHtmlImages,
  transformCoverImage,
  transformPostImages,
} from './image-transform.js';
import type { ImageTransformContext } from '../types/loader.js';

describe('isHashnodeImageUrl', () => {
  it('returns true for Hashnode CDN URLs', () => {
    expect(
      isHashnodeImageUrl(
        'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.jpg'
      )
    ).toBe(true);
    expect(
      isHashnodeImageUrl(
        'http://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.png'
      )
    ).toBe(true);
  });

  it('returns false for non-Hashnode URLs', () => {
    expect(isHashnodeImageUrl('https://example.com/image.jpg')).toBe(false);
    expect(isHashnodeImageUrl('https://images.unsplash.com/photo.jpg')).toBe(
      false
    );
    expect(isHashnodeImageUrl('https://cdn.other.com/image.png')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isHashnodeImageUrl('')).toBe(false);
    expect(isHashnodeImageUrl('not-a-url')).toBe(false);
  });
});

describe('transformCoverImage', () => {
  const mockPostContext = {
    id: 'post-123',
    title: 'Test Post',
  };

  it('transforms Hashnode CDN URLs', async () => {
    const originalUrl =
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg';
    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/cover.jpg');

    const result = await transformCoverImage(
      originalUrl,
      transformFn,
      mockPostContext
    );

    expect(result).toBe('https://cloudflare.com/images/cover.jpg');
    expect(transformFn).toHaveBeenCalledWith(originalUrl, {
      type: 'cover',
      postId: 'post-123',
      postTitle: 'Test Post',
      originalUrl,
    });
  });

  it('does not transform non-Hashnode URLs', async () => {
    const originalUrl = 'https://example.com/cover.jpg';
    const transformFn = vi.fn();

    const result = await transformCoverImage(
      originalUrl,
      transformFn,
      mockPostContext
    );

    expect(result).toBe(originalUrl);
    expect(transformFn).not.toHaveBeenCalled();
  });

  it('returns original URL on transformation error', async () => {
    const originalUrl =
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg';
    const transformFn = vi
      .fn()
      .mockRejectedValue(new Error('Transform failed'));

    // Mock console.warn to suppress error output
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const result = await transformCoverImage(
      originalUrl,
      transformFn,
      mockPostContext
    );

    expect(result).toBe(originalUrl);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to transform cover image URL')
    );

    consoleWarnSpy.mockRestore();
  });

  it('supports synchronous transform functions', async () => {
    const originalUrl =
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg';
    const transformFn = vi
      .fn()
      .mockReturnValue('https://cloudflare.com/images/cover.jpg');

    const result = await transformCoverImage(
      originalUrl,
      transformFn,
      mockPostContext
    );

    expect(result).toBe('https://cloudflare.com/images/cover.jpg');
  });
});

describe('transformHtmlImages', () => {
  const mockPostContext = {
    id: 'post-456',
    title: 'Test Post with Images',
  };

  it('transforms single Hashnode image in HTML', async () => {
    const html =
      '<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.jpg" alt="Test">';
    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/image.jpg');

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toBe(
      '<img src="https://cloudflare.com/images/image.jpg" alt="Test">'
    );
    expect(transformFn).toHaveBeenCalledWith(
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.jpg',
      expect.objectContaining({
        type: 'inline',
        postId: 'post-456',
        postTitle: 'Test Post with Images',
      })
    );
  });

  it('transforms multiple Hashnode images', async () => {
    const html = `
      <p>Some text</p>
      <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image1.jpg" alt="First">
      <p>More text</p>
      <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v5678/image2.png" alt="Second">
    `;

    const transformFn = vi
      .fn()
      .mockResolvedValueOnce('https://cloudflare.com/images/image1.jpg')
      .mockResolvedValueOnce('https://cloudflare.com/images/image2.png');

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toContain('https://cloudflare.com/images/image1.jpg');
    expect(result).toContain('https://cloudflare.com/images/image2.png');
    expect(transformFn).toHaveBeenCalledTimes(2);
  });

  it('preserves non-Hashnode images unchanged', async () => {
    const html = `
      <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/hashnode.jpg" alt="Hashnode">
      <img src="https://example.com/other.jpg" alt="Other">
      <img src="https://unsplash.com/photo.jpg" alt="Unsplash">
    `;

    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/hashnode.jpg');

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toContain('https://cloudflare.com/images/hashnode.jpg');
    expect(result).toContain('https://example.com/other.jpg');
    expect(result).toContain('https://unsplash.com/photo.jpg');
    expect(transformFn).toHaveBeenCalledTimes(1); // Only Hashnode image
  });

  it('handles images with complex attributes', async () => {
    const html =
      '<img class="hero" data-id="123" src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.jpg" alt="Test" loading="lazy">';
    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/image.jpg');

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toContain('https://cloudflare.com/images/image.jpg');
    expect(result).toContain('class="hero"');
    expect(result).toContain('data-id="123"');
    expect(result).toContain('loading="lazy"');
  });

  it('preserves original URL on transformation error', async () => {
    const originalUrl =
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/image.jpg';
    const html = `<img src="${originalUrl}" alt="Test">`;
    const transformFn = vi
      .fn()
      .mockRejectedValue(new Error('Transform failed'));

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toBe(html);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to transform image URL')
    );

    consoleWarnSpy.mockRestore();
  });

  it('returns original HTML when no images present', async () => {
    const html = '<p>Just text, no images</p>';
    const transformFn = vi.fn();

    const result = await transformHtmlImages(
      html,
      transformFn,
      mockPostContext
    );

    expect(result).toBe(html);
    expect(transformFn).not.toHaveBeenCalled();
  });

  it('handles empty HTML', async () => {
    const transformFn = vi.fn();

    const result = await transformHtmlImages('', transformFn, mockPostContext);

    expect(result).toBe('');
    expect(transformFn).not.toHaveBeenCalled();
  });
});

describe('transformPostImages', () => {
  const mockPost = {
    id: 'post-789',
    title: 'Full Post Test',
    coverImage: {
      url: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg',
    },
    content: {
      html: '<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v5678/inline.jpg" alt="Inline">',
    },
  };

  it('transforms both cover and inline images', async () => {
    const transformFn = vi
      .fn()
      .mockResolvedValueOnce('https://cloudflare.com/images/cover.jpg')
      .mockResolvedValueOnce('https://cloudflare.com/images/inline.jpg');

    const result = await transformPostImages(mockPost, transformFn);

    expect(result.coverImage?.url).toBe(
      'https://cloudflare.com/images/cover.jpg'
    );
    expect(result.content?.html).toContain(
      'https://cloudflare.com/images/inline.jpg'
    );
    expect(transformFn).toHaveBeenCalledTimes(2);
  });

  it('handles posts without cover image', async () => {
    const postWithoutCover = {
      id: 'post-no-cover',
      title: 'No Cover',
      content: {
        html: '<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/inline.jpg" alt="Inline">',
      },
    };

    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/inline.jpg');

    const result = await transformPostImages(postWithoutCover, transformFn);

    expect(result.content?.html).toContain(
      'https://cloudflare.com/images/inline.jpg'
    );
    expect(transformFn).toHaveBeenCalledTimes(1);
  });

  it('handles posts without content', async () => {
    const postWithoutContent = {
      id: 'post-no-content',
      title: 'No Content',
      coverImage: {
        url: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg',
      },
    };

    const transformFn = vi
      .fn()
      .mockResolvedValue('https://cloudflare.com/images/cover.jpg');

    const result = await transformPostImages(postWithoutContent, transformFn);

    expect(result.coverImage?.url).toBe(
      'https://cloudflare.com/images/cover.jpg'
    );
    expect(transformFn).toHaveBeenCalledTimes(1);
  });

  it('preserves post structure and other properties', async () => {
    const transformFn = vi
      .fn()
      .mockResolvedValueOnce('https://cloudflare.com/images/cover.jpg')
      .mockResolvedValueOnce('https://cloudflare.com/images/inline.jpg');

    const result = await transformPostImages(mockPost, transformFn);

    expect(result.id).toBe('post-789');
    expect(result.title).toBe('Full Post Test');
  });
});

describe('ImageTransformContext', () => {
  it('provides correct context for cover images', async () => {
    const transformFn = vi.fn((url: string, context: ImageTransformContext) => {
      expect(context.type).toBe('cover');
      expect(context.postId).toBe('test-id');
      expect(context.postTitle).toBe('Test Title');
      expect(context.originalUrl).toBe(url);
      return 'transformed-url';
    });

    await transformCoverImage(
      'https://cdn.hashnode.com/res/hashnode/image/upload/v1234/cover.jpg',
      transformFn,
      { id: 'test-id', title: 'Test Title' }
    );

    expect(transformFn).toHaveBeenCalled();
  });

  it('provides correct context for inline images', async () => {
    const html =
      '<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1234/inline.jpg" alt="Test">';
    const transformFn = vi.fn((url: string, context: ImageTransformContext) => {
      expect(context.type).toBe('inline');
      expect(context.postId).toBe('test-id');
      expect(context.postTitle).toBe('Test Title');
      expect(context.originalUrl).toBe(url);
      return 'transformed-url';
    });

    await transformHtmlImages(html, transformFn, {
      id: 'test-id',
      title: 'Test Title',
    });

    expect(transformFn).toHaveBeenCalled();
  });
});
