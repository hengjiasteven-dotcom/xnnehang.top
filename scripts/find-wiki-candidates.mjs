import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const postsDir = path.resolve('src/content/posts')
const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'))

const posts = files.map((file) => {
  const content = readFileSync(path.join(postsDir, file), 'utf-8')
  const titleMatch = content.match(/^title:\s*(.+)$/m)
  const body = content.replace(/---[\s\S]*?---\n?/, '')
  return {
    file,
    slug: file.replace(/\.md$/, ''),
    title: titleMatch ? titleMatch[1].trim() : file,
    body,
  }
})

// Ignore these overly common Chinese words as keyword hits
const IGNORE_WORDS = new Set([
  '存在', '我们', '故事', '没有', '明天', '昨天', '相恋', '旋律',
  '一个', '可以', '这个', '那个', '什么', '怎么', '就是', '不是',
  '但是', '因为', '所以', '如果', '时候', '已经', '他们', '自己',
  '知道', '觉得', '看到', '开始', '喜欢', '之后', '现在', '然后',
  '最后', '第一', '一点', '东西', '出来', '过来', '起来', '还是',
  '只是', '不过', '还有', '或者', '虽然', '而且', '同时', '因为',
  '所以', '之间', '之中', '之后', '以后', '以前', '当时', '从来',
  '全部', '完全', '一定', '一起', '特别', '很多', '非常', '真的',
  '其实', '终于', '突然', '从来', '原来', '居然', '果然', '当然',
  '没有明天的我们', '在昨天相恋',
])

// Extract meaningful keywords from a title
function extractKeywords(title) {
  const cleaned = title
    .replace(/[《》「」『』【】]/g, '')
    .replace(/阅读手记|观后|手记|观后感|笔记/g, '')
    .replace(/[，、．·：；\s,.\-—/]+/g, '|')
    .trim()

  const parts = cleaned.split('|').filter((p) => p.length >= 2)

  const keywords = new Set()

  for (const part of parts) {
    // Full part if ≥ 3 chars
    if (part.length >= 3) keywords.add(part)
    // Try splitting on 与/和 for multi-topic titles
    for (const sep of ['与', '和']) {
      if (part.includes(sep)) {
        part.split(sep).filter((s) => s.length >= 3).forEach((s) => keywords.add(s.trim()))
      }
    }
  }

  return Array.from(keywords).filter((k) => !IGNORE_WORDS.has(k) && k.length >= 3)
}

console.log('')

for (const post of posts) {
  const lowerBody = post.body.toLowerCase()
  const candidates = []

  for (const other of posts) {
    if (other.slug === post.slug) continue

    const keywords = extractKeywords(other.title)
    const matchedKw = keywords.filter((kw) => lowerBody.includes(kw.toLowerCase()))

    if (matchedKw.length > 0) {
      candidates.push({ title: other.title, keywords: matchedKw })
    }
  }

  candidates.sort((a, b) => b.keywords.length - a.keywords.length)

  if (candidates.length > 0) {
    console.log(`\n## ${post.title}`)
    for (const c of candidates) {
      console.log(`   → [[${c.title}]]  (命中: ${c.keywords.join(', ')})`)
    }
  }
}
