import { defineCollection } from 'astro:content';
import { postsLoader, draftsLoader } from 'astro-loader-hashnode';

export const publicationHost =
  process.env.HASHNODE_PUBLICATION_HOST || 'engineering.hashnode.com';
const token = process.env.HASHNODE_TOKEN;

console.log('Content config - Publication Host:', publicationHost);
console.log('Content config - Token exists:', !!token);

// Define collections
const blog = defineCollection({
  loader: postsLoader({
    publicationHost,
    token,
    maxPosts: 10,
    includeComments: true,
    includeCoAuthors: true,
    includeTableOfContents: true
  })
});

const drafts = token
  ? defineCollection({
      loader: draftsLoader({
        publicationHost,
        token,
        maxDrafts: 2
      })
    })
  : undefined;

export const collections = {
  blog,
  ...(drafts ? { drafts } : {})
};
