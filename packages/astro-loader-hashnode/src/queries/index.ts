/**
 * GraphQL query utilities
 */

// Inline GraphQL queries to avoid file system access during build
export const QUERIES = {
  // Search queries
  SEARCH_POSTS: `
    query SearchPosts($first: Int!, $after: String, $filter: SearchPostsOfPublicationInput!) {
      searchPostsOfPublication(first: $first, after: $after, filter: $filter) {
        edges {
          cursor
          node {
            id
            cuid
            title
            subtitle
            brief
            slug
            url
            content {
              html
            }
            coverImage {
              url
              attribution
              isPortrait
              isAttributionHidden
            }
            publishedAt
            updatedAt
            readTimeInMinutes
            views
            reactionCount
            responseCount
            replyCount
            author {
              id
              name
              username
              profilePicture
              bio {
                html
                text
              }
              followersCount
            }
            tags {
              id
              name
              slug
            }
            seo {
              title
              description
            }
            ogMetaData {
              image
            }
            series {
              id
              name
              slug
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,

  // Drafts queries
  GET_DRAFT_BY_ID: `
    query GetDraftById($id: ObjectId!) {
      draft(id: $id) {
        id
        title
        canonicalUrl
        subtitle
        features {
          tableOfContents {
            isEnabled
            items {
              id
              level
              parentId
              slug
              title
            }
          }
        }
        content {
          markdown
        }
        coverImage {
          url
        }
        author {
          id
          name
          username
          profilePicture
        }
        updatedAt
        tags {
          id
          name
          slug
        }
      }
    }
  `,

  GET_USER_DRAFTS: `
    query GetUserDrafts($first: Int = 20) {
      me {
        drafts(first: $first) {
          edges {
            node {
              id
              title
              subtitle
              content {
                markdown
              }
              coverImage {
                url
              }
              author {
                id
                name
                username
                profilePicture
              }
              updatedAt
              tags {
                id
                name
                slug
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `,
} as const;

// Direct query accessors (no need for extraction since queries are inlined)
export const searchPostsQuery = () => QUERIES.SEARCH_POSTS;
export const getDraftByIdQuery = () => QUERIES.GET_DRAFT_BY_ID;
export const getUserDraftsQuery = () => QUERIES.GET_USER_DRAFTS;

/**
 * Build dynamic GraphQL query with conditional fields
 */
export function buildDynamicPostsQuery(options: {
  includeComments?: boolean;
  maxComments?: number;
  includeCoAuthors?: boolean;
  includeTableOfContents?: boolean;
  includePublicationMeta?: boolean;
}): string {
  const {
    includeComments = false,
    maxComments = 25,
    includeCoAuthors = false,
    includeTableOfContents = false,
    includePublicationMeta = false,
  } = options;

  return `
    query GetPosts(
      $host: String!
      $first: Int!
      $after: String
    ) {
      publication(host: $host) {
        id
        title
        url
        posts(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              cuid
              title
              subtitle
              brief
              slug
              url
              content {
                html
                ${includeTableOfContents ? 'markdown' : ''}
              }
              coverImage {
                url
                attribution
                isPortrait
                isAttributionHidden
              }
              publishedAt
              updatedAt
              readTimeInMinutes
              views
              reactionCount
              responseCount
              replyCount
              hasLatexInPost
              author {
                id
                name
                username
                profilePicture
                bio {
                  html
                  text
                }
                socialMediaLinks {
                  website
                  github
                  twitter
                  linkedin
                }
                followersCount
              }
              tags {
                id
                name
                slug
              }
              seo {
                title
                description
              }
              ogMetaData {
                image
              }
              series {
                id
                name
                slug
              }
              preferences {
                disableComments
                stickCoverToBottom
              }
              
              ${
                includeCoAuthors
                  ? `
              coAuthors {
                id
                name
                username
                profilePicture
                bio {
                  html
                }
              }
              `
                  : ''
              }
              
              ${
                includeTableOfContents
                  ? `
              features {
                tableOfContents {
                  isEnabled
                  items {
                    id
                    level
                    parentId
                    slug
                    title
                  }
                }
              }
              `
                  : ''
              }
              
              ${
                includePublicationMeta
                  ? `
              publication {
                id
                title
                displayTitle
                url
                isTeam
                favicon
                about {
                  html
                }
                features {
                  newsletter {
                    isEnabled
                  }
                  readTime {
                    isEnabled
                  }
                  textSelectionSharer {
                    isEnabled
                  }
                  audioBlog {
                    isEnabled
                    voiceType
                  }
                  customCSS {
                    isEnabled
                  }
                }
              }
              `
                  : ''
              }
              
              ${
                includeComments
                  ? `
              comments(first: ${maxComments}) {
                totalDocuments
                edges {
                  node {
                    id
                    dateAdded
                    totalReactions
                    content {
                      html
                      markdown
                    }
                    author {
                      id
                      name
                      username
                      profilePicture
                    }
                    replies(first: 10) {
                      edges {
                        node {
                          id
                          dateAdded
                          content {
                            html
                            markdown
                          }
                          author {
                            id
                            name
                            username
                            profilePicture
                          }
                        }
                      }
                    }
                  }
                }
              }
              `
                  : ''
              }
            }
          }
        }
      }
    }
  `;
}
