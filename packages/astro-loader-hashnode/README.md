# astro-loader-hashnode

Astro content loader for seamlessly integrating Hashnode blog posts into your Astro website using the Content Layer API.

## Installation

```bash
npm install astro-loader-hashnode
# or
pnpm add astro-loader-hashnode
# or
yarn add astro-loader-hashnode
```

## Quick Start

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { hashnodeLoader } from 'astro-loader-hashnode';

export const collections = {
  blog: defineCollection({
    loader: hashnodeLoader({
      publicationHost: 'your-blog.hashnode.dev',
    }),
  }),
};
```

## Features

- 🚀 **Easy Setup** - One-line configuration to get started
- 📝 **Rich Content** - Full post content, metadata, and assets
- 🔄 **Multiple Loaders** - Posts, series, drafts, and search
- 🎯 **Type Safety** - Full TypeScript support
- ⚡ **Performance** - Built-in caching and pagination
- 🛠️ **Utilities** - SEO helpers, content processing, and more
- 🧪 **Schema Exposure** - Built-in Zod schema exported to Astro for type inference
- 🧵 **Incremental Updates** - Digest-based change detection to skip unchanged entries
- 🖨️ **Pre-render Support** - Each entry includes `rendered.html` so you can use Astro's `render(entry)` API
- 📌 **Post Preferences** - Access Hashnode preferences like `pinnedToBlog` and `isDelisted`
- 🖼️ **Image Transformation** - Transform Hashnode CDN images to any CDN service during build

## Documentation

Visit our [documentation](https://github.com/raisedadead/astro-loader-hashnode#readme) for detailed usage instructions
and examples.

### Image Transformation

Transform Hashnode CDN images to your preferred CDN or image service during build. The `transformImage` hook allows you
to intercept and transform all image URLs (cover images and inline HTML images) from Hashnode.

#### Basic Usage

```ts
// src/content.config.ts
import { hashnodeLoader } from 'astro-loader-hashnode';

export const collections = {
  blog: defineCollection({
    loader: hashnodeLoader({
      publicationHost: 'your-blog.hashnode.dev',
      transformImage: (url, context) => {
        // Transform Hashnode CDN URLs to your CDN
        if (url.includes('cdn.hashnode.com')) {
          return url.replace('cdn.hashnode.com', 'images.example.com');
        }
        return url;
      },
    }),
  }),
};
```

#### Context Object

The transform function receives metadata about each image:

```ts
interface ImageTransformContext {
  type: 'cover' | 'inline'; // Image type
  postId: string; // Post ID
  postTitle: string; // Post title
  originalUrl: string; // Original Hashnode URL
}
```

#### Cloudflare Images Example

```ts
import { hashnodeLoader } from 'astro-loader-hashnode';
import crypto from 'node:crypto';

// Upload helper (use your preferred method)
async function uploadToCloudflare(url: string, postId: string) {
  const filename = crypto.createHash('md5').update(url).digest('hex');
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    body: JSON.stringify({ url, id: `${postId}-${filename}` }),
  });
  const data = await response.json();
  return data.result.variants[0]; // CDN URL
}

export const collections = {
  blog: defineCollection({
    loader: hashnodeLoader({
      publicationHost: 'your-blog.hashnode.dev',
      transformImage: async (url, context) => {
        // Only transform Hashnode CDN images
        if (!url.includes('cdn.hashnode.com')) {
          return url;
        }

        // Upload and get Cloudflare CDN URL
        const cdnUrl = await uploadToCloudflare(url, context.postId);
        console.log(`Transformed ${context.type} image for "${context.postTitle}"`);

        return cdnUrl;
      },
    }),
  }),
};
```

#### Custom CDN Example

```ts
export const collections = {
  blog: defineCollection({
    loader: hashnodeLoader({
      publicationHost: 'your-blog.hashnode.dev',
      transformImage: (url, context) => {
        if (!url.includes('cdn.hashnode.com')) return url;

        // Extract image ID from Hashnode URL
        const match = url.match(/upload\/v(\d+)\/(.+)$/);
        if (!match) return url;

        const [, version, filename] = match;

        // Transform to your CDN with optimizations
        return `https://cdn.yoursite.com/blog/${context.postId}/${filename}?w=1200&q=80`;
      },
    }),
  }),
};
```

#### What Gets Transformed

- Cover images (`coverImage.url`)
- Inline images in HTML content (`<img>` tags)
- Only Hashnode CDN URLs (other CDN images preserved)

Non-Hashnode images remain unchanged, allowing mixed CDN usage.

### Rendering Content

Astro can render an entry via `render(entry)`. Because the loader now supplies a `rendered` field (HTML + metadata), you
can also directly set HTML:

```astro
---
import { getEntry } from 'astro:content';
const post = await getEntry('blog', 'my-post-slug');
const { data, render } = post;
// Option 1: use pre-rendered HTML
const html = data.content.html;
// Option 2: let Astro render (works if markdown available)
const rendered = await render();
---
<article set:html={html} />
```

### Preferences Fields

Some extra post preference flags are included when present on Hashnode:

```ts
data.preferences?.pinnedToBlog; // boolean | undefined
data.preferences?.isDelisted; // boolean | undefined
```

### Change Detection (Digest)

Each stored entry includes a digest used internally to skip unchanged items on subsequent loads, improving build
performance.

## License

MIT © [Mrugesh Mohapatra](https://mrugesh.dev)
