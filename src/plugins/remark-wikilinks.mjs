import { readdirSync, readFileSync } from 'node:fs'
import { visit } from 'unist-util-visit'
import path from 'node:path'
import { WIKI_LINK_REGEX } from '../utils/wiki-regex.ts'

let titleToSlug = null

function buildTitleMap() {
  if (titleToSlug) return titleToSlug
  titleToSlug = new Map()
  const postsDir = path.resolve('src/content/posts')
  let files
  try {
    files = readdirSync(postsDir).filter((f) => f.endsWith('.md'))
  } catch {
    return titleToSlug
  }
  for (const file of files) {
    const content = readFileSync(path.join(postsDir, file), 'utf-8')
    const match = content.match(/^title:\s*(.+)$/m)
    if (match) {
      const slug = file.replace(/\.md$/, '')
      titleToSlug.set(match[1].trim().toLowerCase(), slug)
    }
  }
  return titleToSlug
}

export function remarkWikiLinks() {
  return (tree) => {
    const map = buildTitleMap()

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (!node.value.includes('[[')) return

      const children = []
      let lastIndex = 0

      // Reset global regex state before use
      WIKI_LINK_REGEX.lastIndex = 0
      let match

      while ((match = WIKI_LINK_REGEX.exec(node.value)) !== null) {
        // text before the link
        if (match.index > lastIndex) {
          children.push({ type: 'text', value: node.value.slice(lastIndex, match.index) })
        }

        const title = match[1].trim()
        const displayText = (match[2] || match[1]).trim()
        const slug = map.get(title.toLowerCase())

        if (slug) {
          children.push({
            type: 'link',
            url: `/posts/${slug}/`,
            children: [{ type: 'text', value: displayText }],
            data: {
              hProperties: {
                class: 'wikilink',
              },
            },
          })
        } else {
          console.warn(`[wikilink] ⚠️  "${title}" 没有匹配到任何文章`)
          children.push({ type: 'text', value: displayText })
        }

        lastIndex = match.index + match[0].length
      }

      // trailing text
      if (lastIndex < node.value.length) {
        children.push({ type: 'text', value: node.value.slice(lastIndex) })
      }

      parent.children.splice(index, 1, ...children)
      return index + children.length - 1
    })
  }
}
