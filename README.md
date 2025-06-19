# Astro Loader Hashnode

A powerful content loader for integrating Hashnode blog posts into your Astro website using the Content Layer API.

## Features

- 🚀 **Built for Astro v5.0+** - Uses the new Content Layer API
- 📡 **GraphQL Integration** - Leverages Hashnode's powerful GraphQL API
- 🔄 **Smart Caching** - Incremental updates with change detection
- 📝 **Full TypeScript Support** - Complete type safety with Zod validation
- 🏷️ **Rich Metadata** - Author info, tags, SEO data, reading time, and more
- 🎨 **Flexible Content** - Access HTML content (Markdown available for drafts)
- 🛡️ **Error Resilient** - Graceful fallbacks and comprehensive error handling
- ⚡ **Performance Optimized** - Cursor-based pagination and selective field querying
- 📚 **Multiple Loaders** - Posts, Series, Drafts, and Search loaders available
- 🔐 **Authentication Support** - Access private content and drafts with API tokens

## Installation

```bash
npm install astro-loader-hashnode
```

## Quick Start

1. **Configure your content collection** in `src/content.config.ts`:

```typescript
import { defineCollection } from 'astro:content';
import { hashnodeLoader } from 'astro-loader-hashnode';

const blog = defineCollection({
  loader: hashnodeLoader({
    publicationHost: 'yourblog.hashnode.dev', // Your Hashnode publication URL
    token: process.env.HASHNODE_TOKEN, // Optional: for private content
    maxPosts: 100, // Optional: limit number of posts
  }),
});

export const collections = {
  blog,
};
```

2. **Use the content in your Astro pages**:

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post }
  }));
}

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const { data } = post;
---

<html>
  <head>
    <title>{data.title}</title>
    <meta name="description" content={data.brief} />
  </head>
  <body>
    <article>
      <h1>{data.title}</h1>
      <p>By {data.author.name} • {data.readingTime} min read</p>
      <div set:html={data.content.html} />
    </article>
  </body>
</html>
```

## Configuration Options

| Option            | Type      | Default      | Description                                                    |
| ----------------- | --------- | ------------ | -------------------------------------------------------------- |
| `publicationHost` | `string`  | **Required** | Your Hashnode publication host (e.g., `yourblog.hashnode.dev`) |
| `token`           | `string`  | `undefined`  | Optional API token for accessing private content               |
| `maxPosts`        | `number`  | `1000`       | Maximum number of posts to fetch                               |
| `includeDrafts`   | `boolean` | `false`      | Whether to include draft posts (requires token)                |

## Advanced Usage

### Multiple Loaders

Access different types of content with specialized loaders:

```typescript
import { defineCollection } from 'astro:content';
import { postsLoader, seriesLoader, draftsLoader, searchLoader } from 'astro-loader-hashnode';

const blog = defineCollection({
  loader: postsLoader({
    publicationHost: 'yourblog.hashnode.dev',
    maxPosts: 100,
    includeComments: true,
    includeCoAuthors: true,
  }),
});

const series = defineCollection({
  loader: seriesLoader({
    publicationHost: 'yourblog.hashnode.dev',
    includePosts: true,
  }),
});

// Requires authentication token
const drafts = defineCollection({
  loader: draftsLoader({
    publicationHost: 'yourblog.hashnode.dev',
    token: process.env.HASHNODE_TOKEN,
  }),
});

const searchResults = defineCollection({
  loader: searchLoader({
    publicationHost: 'yourblog.hashnode.dev',
    searchTerms: ['javascript', 'react', 'astro'],
  }),
});

export const collections = {
  blog,
  series,
  drafts,
  searchResults,
};
```

### Environment Variables

Create a `.env` file in your project root:

```env
HASHNODE_TOKEN=your_hashnode_token_here
HASHNODE_PUBLICATION_HOST=yourblog.hashnode.dev
```

### Content Schema

Each post includes comprehensive metadata:

```typescript
{
  // Core content
  title: string;
  brief: string;
  content: {
    html: string;
    markdown?: string; // Available for drafts
  };

  // Publishing metadata
  publishedAt: Date;
  updatedAt?: Date;

  // Media
  coverImage?: {
    url: string;
    alt?: string;
  };

  // Taxonomies
  tags: Array<{
    name: string;
    slug: string;
  }>;

  // Author
  author: {
    name: string;
    username: string;
    profilePicture?: string;
    url?: string;
  };

  // SEO
  seo: {
    title?: string;
    description?: string;
  };

  // Reading metadata
  readingTime: number;
  wordCount: number;

  // Hashnode-specific
  hashnodeId: string;
  hashnodeUrl: string;
}
```

### RSS Feeds

```typescript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');

  return rss({
    title: 'My Blog',
    description: 'My blog powered by Hashnode',
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.brief,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

## Getting Your Hashnode API Token

1. Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer)
2. Generate a new Personal Access Token
3. Add it to your `.env` file as `HASHNODE_TOKEN`

> **Note**: The API token is only required for accessing private content and drafts. Public posts work without
> authentication.

## Performance Features

- **Incremental Updates**: Content digests prevent re-processing unchanged posts
- **Cursor-based Pagination**: Efficiently handles large publications
- **Error Handling**: Graceful error handling for API limits and network issues
- **Smart Caching**: Implements fallbacks for network failures

## Example Project

Try the demo project to see the loader in action:

```bash
cd examples/demo
pnpm install
pnpm run dev
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for detailed information on:

- Development setup and workflow
- Testing guidelines
- Commit conventions
- Release process
- Code style requirements

For quick contributions: fork the repo, make your changes, and submit a pull request!

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Related Links

- **[Astro Documentation](https://docs.astro.build/)** - Learn about Astro
- **[Astro Content Layer](https://docs.astro.build/en/guides/content-layer/)** - Content Layer API guide
- **[Hashnode](https://hashnode.com/)** - The blogging platform
- **[Hashnode API Documentation](https://apidocs.hashnode.com/)** - API reference
- **[Astro Discord](https://astro.build/chat)** - Get help from the community

## Support

- [Issues](https://github.com/raisedadead/astro-loader-hashnode/issues)
- [Discussions](https://github.com/raisedadead/astro-loader-hashnode/discussions)
