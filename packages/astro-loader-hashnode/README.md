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

## Documentation

Visit our [documentation](https://github.com/raisedadead/astro-loader-hashnode#readme) for detailed usage instructions
and examples.

## License

MIT © [Mrugesh Mohapatra](mailto:noreply@mrugesh.dev)
