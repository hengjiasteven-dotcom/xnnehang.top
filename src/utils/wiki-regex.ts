/**
 * Shared regex and helper for parsing [[wiki link]] syntax.
 * Both remark-wikilinks.mjs (markdown AST) and wikilinks.ts (build-time graph)
 * must use the same logic. Change here if the syntax evolves.
 */

// Matches [[Title]] or [[Title|Display Text]]
export const WIKI_LINK_REGEX = /\[\[(.+?)(?:\|(.+?))?\]\]/g

/**
 * Extract wiki link references from raw markdown text.
 * Returns array of { title, displayText } objects.
 */
export function parseWikiLinks(text) {
  const links = []
  let match
  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    links.push({
      title: match[1].trim(),
      displayText: (match[2] || match[1]).trim(),
    })
  }
  return links
}
