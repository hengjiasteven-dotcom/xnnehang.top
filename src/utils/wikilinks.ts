import { getCollection, type CollectionEntry } from 'astro:content'
import { WIKI_LINK_REGEX } from './wiki-regex'

export type WikiLinkInfo = {
  resolved: { title: string; slug: string }[]
  unresolved: string[]
}

export type WikiGraph = Map<string, { outbound: WikiLinkInfo; inbound: { slug: string; title: string }[] }>

/**
 * Build the wiki link graph from all post bodies.
 * Runs at build time in getStaticPaths.
 */
export async function buildWikiGraph(): Promise<WikiGraph> {
  const allPosts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  // Build title (lowercased) → slug map from frontmatter
  const titleToSlug = new Map<string, string>()
  // Also build slug → title for reverse lookup
  const slugToTitle = new Map<string, string>()
  for (const post of allPosts) {
    const title = post.data.title.trim()
    if (title) {
      titleToSlug.set(title.toLowerCase(), post.id)
      slugToTitle.set(post.id, title)
    }
  }

  // Extract wiki links from each post body
  const graph: WikiGraph = new Map()
  const regex = WIKI_LINK_REGEX

  for (const post of allPosts) {
    if (!post.body) continue

    const resolved: { title: string; slug: string }[] = []
    const unresolved: string[] = []
    const seen = new Set<string>()

    let match
    regex.lastIndex = 0
    while ((match = regex.exec(post.body)) !== null) {
      const title = match[1].trim()
      if (seen.has(title)) continue
      seen.add(title)

      const slug = titleToSlug.get(title.toLowerCase())
      if (slug) {
        resolved.push({ title, slug })
      } else {
        unresolved.push(title)
      }
    }

    graph.set(post.id, {
      outbound: { resolved, unresolved },
      inbound: [],
    })
  }

  // Build inbound links: for each post, find which other posts link to it
  for (const [slug, data] of graph) {
    for (const link of data.outbound.resolved) {
      const targetGraph = graph.get(link.slug)
      if (targetGraph) {
        targetGraph.inbound.push({ slug, title: slugToTitle.get(slug) || '' })
      }
    }
  }

  return graph
}
