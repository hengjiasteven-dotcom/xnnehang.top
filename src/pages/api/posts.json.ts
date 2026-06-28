import { getCollection, type CollectionEntry } from 'astro:content'

type Post = CollectionEntry<'posts'>

const SITE_URL = 'https://xnnehang.top'
const MAX_POSTS = 3

// Convert a frontmatter-relative image path like "../../assets/img/covers/foo.jpg"
// to an absolute GitHub raw URL so external consumers (e.g. profile README scripts)
// can embed the image without needing the built site.
const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/MrXnneHang/xnnehang.top/main'

function resolveImageUrl(image: string | undefined): string | null {
  if (!image) return null
  // Already an absolute URL – return as-is
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  // Relative path from src/content/posts/ (e.g. "../../assets/img/covers/foo.jpg")
  // Strip leading "../" sequences and prepend the src/ prefix
  const stripped = image.replace(/^(\.\.\/)+/, '')
  return `${GITHUB_RAW_BASE}/src/${stripped}`
}

// Extract the first markdown image from post body as a cover fallback.
// Handles both "![alt](path)" and the Astro-specific "![alt](../../assets/...)" patterns.
function extractFirstBodyImage(body: string | undefined): string | null {
  if (!body) return null
  const match = body.match(/!\[.*?\]\(([^)]+)\)/)
  if (!match) return null
  return resolveImageUrl(match[1].trim())
}

export async function GET() {
  const allPosts = await getCollection('posts', ({ data }: Post) => {
    return data.draft !== true && data.featured === true
  })

  // Sort by published date, newest first
  allPosts.sort(
    (a: Post, b: Post) =>
      new Date(b.data.published).getTime() - new Date(a.data.published).getTime(),
  )

  const posts = allPosts.slice(0, MAX_POSTS).map((post: Post) => {
    const coverUrl =
      resolveImageUrl(post.data.image) ??
      extractFirstBodyImage(post.body)

    return {
      title: post.data.title,
      description: post.data.description || '',
      published: post.data.published.toISOString().slice(0, 10),
      url: `${SITE_URL}/posts/${post.id}/`,
      coverUrl,
    }
  })

  return new Response(JSON.stringify(posts, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      // Allow GitHub Actions scripts to fetch this endpoint cross-origin
      'Access-Control-Allow-Origin': '*',
    },
  })
}

