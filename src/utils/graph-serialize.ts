import type { WikiGraph } from './wikilinks'
import type { GraphLink, SerializedGraph } from '@/types/graph'

/**
 * Convert the build-time WikiGraph (Map) into a plain serializable object.
 * Requires a pre-built slugToTitle map for accurate node titles.
 */
export function serializeWikiGraphWithTitles(
  wikiGraph: WikiGraph,
  slugToTitle: Map<string, string>,
): SerializedGraph {
  const nodes: SerializedGraph['nodes'] = []
  const links: SerializedGraph['links'] = []

  for (const [slug, data] of wikiGraph) {
    nodes.push({
      id: slug,
      title: slugToTitle.get(slug) || slug,
      linkCount: data.outbound.resolved.length + data.inbound.length,
    })

    for (const link of data.outbound.resolved) {
      links.push({ source: slug, target: link.slug })
    }
  }

  return { nodes, links }
}

/**
 * Extract a 1-degree neighborhood subgraph around `currentSlug`.
 */
export function getMiniGraph(
  graph: SerializedGraph,
  currentSlug: string,
): SerializedGraph {
  const connectedIds = new Set<string>([currentSlug])
  const miniLinks: GraphLink[] = []

  for (const link of graph.links) {
    if (link.source === currentSlug || link.target === currentSlug) {
      connectedIds.add(link.source)
      connectedIds.add(link.target)
      miniLinks.push(link)
    }
  }

  return {
    nodes: graph.nodes.filter(n => connectedIds.has(n.id)),
    links: miniLinks,
  }
}