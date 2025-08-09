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

## Documentation

Visit our [documentation](https://github.com/raisedadead/astro-loader-hashnode#readme) for detailed usage instructions
and examples.

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
