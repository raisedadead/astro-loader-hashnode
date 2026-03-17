# Astro Loader Hashnode

> A content loader for [Astro](https://docs.astro.build/) that pulls blog posts from [Hashnode](https://hashnode.com/) via the [Content Layer API](https://docs.astro.build/en/guides/content-layer/).

## What is this about?

A set of loaders for Astro v5.0+ that fetch posts, series, drafts, and search results from Hashnode's GraphQL API. Supports incremental builds, full TypeScript types, and rendered HTML out of the box.

## Features

- **Built for Astro v5.0+** – Uses the new Content Layer API
- **GraphQL Integration** – Leverages Hashnode's GraphQL API
- **Smart Caching** – Incremental updates with change detection
- **Digest-based Incremental Loads** – Skips unchanged entries for faster rebuilds
- **Rendered HTML Support** – Each entry includes `rendered.html` for `render(entry)` usage
- **Schema Auto-Exposure** – Loader exports its internal Zod schema (you can override)
- **Full TypeScript Support** – Complete type safety with Zod validation
- **Rich Metadata** – Author info, tags, SEO/OG data, reading time, TOC, and more
- **Multiple Loaders** – Posts, Series, Drafts, Search (more can be added)
- **Authentication Support** – Access drafts and private data with a token

## Installation

```bash
pnpm add astro-loader-hashnode
# or
npm install astro-loader-hashnode
# or
yarn add astro-loader-hashnode
```

## Quick Start

### 1. Get your Hashnode API token

1. Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer)
2. Generate a new Personal Access Token
3. Add it to your `.env` file as `HASHNODE_TOKEN`

> **Note**: The API token is only required for accessing private content and drafts. Public posts work without authentication.

### 2. Configure your collection (`src/content.config.ts`)

```ts
import { defineCollection } from "astro:content";
import { hashnodeLoader } from "astro-loader-hashnode";

const blog = defineCollection({
  loader: hashnodeLoader({
    publicationHost: "yourblog.hashnode.dev", // Required
    token: process.env.HASHNODE_TOKEN, // Optional
    maxPosts: 100, // Optional
  }),
});

export const collections = { blog };
```

### 3. Render a post page (`src/pages/blog/[...slug].astro`)

```astro
---
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { data, render } = post; // render() available if you want Astro to render markdown
const html = data.content.html; // Pre-rendered HTML already available
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
      <div set:html={html} />
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
import { defineCollection } from "astro:content";
import { postsLoader, seriesLoader, draftsLoader, searchLoader } from "astro-loader-hashnode";

const blog = defineCollection({
  loader: postsLoader({
    publicationHost: "yourblog.hashnode.dev",
    maxPosts: 100,
    includeComments: true,
    includeCoAuthors: true,
  }),
});

const series = defineCollection({
  loader: seriesLoader({
    publicationHost: "yourblog.hashnode.dev",
    includePosts: true,
  }),
});

// Requires authentication token
const drafts = defineCollection({
  loader: draftsLoader({
    publicationHost: "yourblog.hashnode.dev",
    token: process.env.HASHNODE_TOKEN,
  }),
});

const searchResults = defineCollection({
  loader: searchLoader({
    publicationHost: "yourblog.hashnode.dev",
    searchTerms: ["javascript", "react", "astro"],
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

  // Preferences (optional when present)
  preferences?: {
    pinnedToBlog?: boolean;
    isDelisted?: boolean;
    disableComments?: boolean;
    stickCoverToBottom?: boolean;
  };

  // Hashnode-specific
  hashnodeId: string;
  hashnodeUrl: string;
}
```

### RSS Feeds

```typescript
// src/pages/rss.xml.js
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("blog");

  return rss({
    title: "My Blog",
    description: "My blog powered by Hashnode",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.brief,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

## Performance Features

- **Incremental Updates** – Content digests prevent re-processing unchanged posts
- **Cursor-based Pagination** – Efficiently handles large publications
- **Error Handling** – Graceful error handling for API limits and network issues
- **Smart Caching** – Implements fallbacks for network failures
- **Schema Reuse** – Exposed schema aids IDE inference without extra config
- **Rendered HTML** – Avoids re-render cost when you just need HTML directly

## Example Project

Try the demo project to see the loader in action:

```bash
cd examples/demo
pnpm install
pnpm run dev
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

ISC License - see [LICENSE](./LICENSE) file for details.
