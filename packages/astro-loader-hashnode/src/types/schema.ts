/**
 * Zod schemas for content validation
 */
import { z } from 'zod';

// Author schema
export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  profilePicture: z.string().url().optional(),
  bio: z.string().optional(),
  url: z.string().url().optional(),
  social: z
    .object({
      website: z.string().url().optional(),
      github: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  followersCount: z.number().optional(),
});

// Tag schema
export const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().url().optional(),
  tagline: z.string().optional(),
  followersCount: z.number().optional(),
});

// Cover image schema
export const coverImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  attribution: z.string().optional(),
  isPortrait: z.boolean().optional(),
  isAttributionHidden: z.boolean().optional(),
});

// Table of contents schema
export const tableOfContentsSchema = z.object({
  isEnabled: z.boolean(),
  items: z.array(
    z.object({
      id: z.string(),
      level: z.number(),
      parentId: z.string().optional(),
      slug: z.string(),
      title: z.string(),
    })
  ),
});

// Comment schema (recursive type for replies)
export const commentSchema: z.ZodLazy<
  z.ZodObject<{
    id: z.ZodString;
    dateAdded: z.ZodString;
    totalReactions: z.ZodOptional<z.ZodNumber>;
    content: z.ZodObject<{
      html: z.ZodString;
      markdown: z.ZodOptional<z.ZodString>;
    }>;
    author: typeof authorSchema;
    replies: z.ZodOptional<
      z.ZodArray<z.ZodLazy<z.ZodObject<Record<string, z.ZodTypeAny>>>>
    >;
  }>
> = z.lazy(() =>
  z.object({
    id: z.string(),
    dateAdded: z.string(),
    totalReactions: z.number().optional(),
    content: z.object({
      html: z.string(),
      markdown: z.string().optional(),
    }),
    author: authorSchema,
    replies: z.array(commentSchema).optional(),
  })
);

// SEO schema
export const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Content schema
export const contentSchema = z.object({
  html: z.string(),
  markdown: z.string().optional(),
});

// Publication schema
export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  displayTitle: z.string().optional(),
  url: z.string().url(),
  isTeam: z.boolean().optional(),
  favicon: z.string().url().optional(),
  about: z.string().optional(),
  features: z
    .object({
      newsletter: z.object({ isEnabled: z.boolean() }).optional(),
      readTime: z.object({ isEnabled: z.boolean() }).optional(),
      textSelectionSharer: z.object({ isEnabled: z.boolean() }).optional(),
      audioBlog: z
        .object({
          isEnabled: z.boolean(),
          voiceType: z.string().optional(),
        })
        .optional(),
      customCSS: z.object({ isEnabled: z.boolean() }).optional(),
    })
    .optional(),
});

// Post schema
export const postSchema = z.object({
  // Core content
  id: z.string(),
  cuid: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  brief: z.string(),
  slug: z.string(),
  url: z.string().url(),
  content: contentSchema,

  // Publishing metadata
  publishedAt: z.date(),
  updatedAt: z.date().optional(),

  // Media
  coverImage: coverImageSchema.optional(),

  // Taxonomies
  tags: z.array(tagSchema),

  // Author information
  author: authorSchema,
  coAuthors: z.array(authorSchema).optional(),

  // SEO
  seo: seoSchema,
  ogMetaData: z
    .object({
      image: z.string().url().optional(),
    })
    .optional(),

  // Reading metadata
  readingTime: z.number(),
  wordCount: z.number().optional(),

  // Engagement metrics
  views: z.number().default(0),
  reactions: z.number().default(0),
  comments: z.number().default(0),
  replies: z.number().default(0),

  // Status
  isDraft: z.boolean().default(false),
  hasLatex: z.boolean().default(false),

  // Series info
  series: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),

  // Table of contents
  tableOfContents: tableOfContentsSchema.optional(),

  // Preferences
  preferences: z
    .object({
      disableComments: z.boolean().optional(),
      stickCoverToBottom: z.boolean().optional(),
    })
    .optional(),

  // Comments data
  commentsData: z
    .object({
      totalCount: z.number(),
      comments: z.array(commentSchema),
    })
    .optional(),

  // Publication info
  publication: publicationSchema.optional(),

  // Hashnode-specific
  hashnodeId: z.string(),
  hashnodeUrl: z.string().url(),
});

// Series schema
export const seriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  descriptionMarkdown: z.string().optional(),
  descriptionText: z.string().optional(),
  coverImage: z.string().url().optional(),
  cuid: z.string().optional(),
  author: authorSchema,
  postsCount: z.number(),
  posts: z.array(z.string()), // Array of post slugs
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Static page schema
export const staticPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: contentSchema,
  seo: seoSchema,
  ogMetaData: z
    .object({
      image: z.string().url().optional(),
    })
    .optional(),
  wordCount: z.number().optional(),
  updatedAt: z.string(),
});

// Tag collection schema
export const tagCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().url().optional(),
  tagline: z.string().optional(),
  followersCount: z.number(),
  postsCount: z.number(),
  posts: z.array(z.string()), // Array of post slugs
  createdAt: z.string(),
  updatedAt: z.string(),
});

// RSS feed schema
export const rssFeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  posts: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      link: z.string().url(),
      pubDate: z.string(),
      author: z.string(),
      guid: z.string(),
    })
  ),
});

// Sitemap schema
export const sitemapSchema = z.object({
  urls: z.array(
    z.object({
      url: z.string().url(),
      lastmod: z.string(),
      priority: z.string(),
    })
  ),
  totalUrls: z.number(),
  generatedAt: z.string(),
});

// Newsletter schema
export const newsletterSchema = z.object({
  id: z.string(),
  title: z.string(),
  displayTitle: z.string().optional(),
  url: z.string().url(),
  isNewsletterEnabled: z.boolean(),
  isNewsletterPageEnabled: z.boolean(),
  followersCount: z.number(),
  description: z.string().optional(),
  about: z.string().optional(),
  author: authorSchema,
  recentPosts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      publishedAt: z.string(),
      brief: z.string().optional(),
    })
  ),
  updatedAt: z.string(),
});

// Search results schema
export const searchResultsSchema = z.object({
  query: z.string(),
  totalResults: z.number(),
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      brief: z.string(),
      slug: z.string(),
      url: z.string().url(),
      publishedAt: z.string(),
      author: z.object({
        id: z.string(),
        name: z.string(),
      }),
      coverImage: z
        .object({
          url: z.string().url(),
        })
        .optional(),
      reactionCount: z.number(),
    })
  ),
  searchedAt: z.string(),
});

// Individual search result schema
export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  brief: z.string(),
  slug: z.string(),
  url: z.string().url(),
  searchTerm: z.string(),
  searchRelevance: z.number(),
  publishedAt: z.date(),
  reactionCount: z.number(),
  views: z.number(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    profilePicture: z.string(),
  }),
  coverImage: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  publication: z
    .object({
      title: z.string(),
      url: z.string().url(),
    })
    .optional(),
  raw: z.object({
    cuid: z.string().optional(),
  }),
});

// Draft schema
export const draftSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  content: z.string(),
  canonicalUrl: z.string().optional(),
  updatedAt: z.date(),
  createdAt: z.date(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    profilePicture: z.string(),
  }),
  coverImage: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  tags: z.array(tagSchema),
  tableOfContents: z.array(
    z.object({
      id: z.string(),
      level: z.number(),
      title: z.string(),
      slug: z.string(),
      parentId: z.string().optional(),
    })
  ),
  isDraft: z.boolean(),
  lastSaved: z.date(),
  raw: z.object({
    id: z.string(),
  }),
});

// Union schema for all content types
export const contentUnionSchema = z.union([
  postSchema,
  seriesSchema,
  staticPageSchema,
  tagCollectionSchema,
  rssFeedSchema,
  sitemapSchema,
  newsletterSchema,
  searchResultsSchema,
]);

export type Post = z.infer<typeof postSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type StaticPage = z.infer<typeof staticPageSchema>;
export type TagCollection = z.infer<typeof tagCollectionSchema>;
export type RSSFeed = z.infer<typeof rssFeedSchema>;
export type Sitemap = z.infer<typeof sitemapSchema>;
export type Newsletter = z.infer<typeof newsletterSchema>;
export type SearchResults = z.infer<typeof searchResultsSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type ContentUnion = z.infer<typeof contentUnionSchema>;

// Type aliases for index.ts exports
export type PostData = Post;
export type SeriesData = Series;
export type SearchResultData = SearchResult;
export type DraftData = Draft;
