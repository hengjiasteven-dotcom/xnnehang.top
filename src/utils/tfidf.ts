import { getCollection, type CollectionEntry } from 'astro:content'

export type PostForRelated = {
  slug: string
  data: CollectionEntry<'posts'>['data']
}

type TfidfVector = number[]
type TfidfIndex = {
  posts: PostForRelated[]
  vectors: Map<string, TfidfVector>
  vocabulary: string[]
}

function tokenize(text: string): string[] {
  const words: string[] = []
  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) {
      const word = seg.segment.trim().toLowerCase()
      if (word.length > 0 && word.length <= 50) words.push(word)
    }
  }
  return words
}

export async function buildTfidfIndex(): Promise<TfidfIndex> {
  const allPosts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const posts: PostForRelated[] = allPosts
    .filter((p) => p.body)
    .map((p) => ({
      slug: p.id,
      data: p.data,
    }))

  // Tokenize all documents
  const tokenizedDocs = new Map<string, string[]>()
  for (const p of allPosts) {
    if (!p.body) continue
    tokenizedDocs.set(p.id, tokenize(p.body))
  }

  // Build vocabulary with document frequency
  const docFreq = new Map<string, number>()
  for (const [, tokens] of tokenizedDocs) {
    const seen = new Set<string>()
    for (const t of tokens) {
      if (!seen.has(t)) {
        seen.add(t)
        docFreq.set(t, (docFreq.get(t) || 0) + 1)
      }
    }
  }

  // Filter vocabulary: keep terms that appear in at least 2 docs and at most 80% of docs
  const D = posts.length
  const vocabulary = Array.from(docFreq.entries())
    .filter(([, df]) => df >= 2 && df <= D * 0.8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5000) // cap vocabulary size
    .map(([term]) => term)

  // Precompute IDF
  const idf = new Map<string, number>()
  for (const term of vocabulary) {
    const df = docFreq.get(term) || 1
    idf.set(term, Math.log((D + 1) / (df + 1)) + 1)
  }

  // Build TF-IDF vectors
  const vectors = new Map<string, TfidfVector>()
  for (const p of posts) {
    const tokens = tokenizedDocs.get(p.slug) || []
    const totalTerms = tokens.length
    if (totalTerms === 0) {
      vectors.set(p.slug, vocabulary.map(() => 0))
      continue
    }

    const tf = new Map<string, number>()
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1)
    }

    const vector = vocabulary.map((term) => {
      const termFreq = (tf.get(term) || 0) / totalTerms
      return termFreq * idf.get(term)!
    })

    vectors.set(p.slug, vector)
  }

  return { posts, vectors, vocabulary }
}

function cosineSimilarity(a: TfidfVector, b: TfidfVector): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export function getRelatedByTfidf(
  slug: string,
  index: TfidfIndex,
  limit = 5,
): PostForRelated[] {
  const vector = index.vectors.get(slug)
  if (!vector) return []

  const scored = index.posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: cosineSimilarity(vector, index.vectors.get(p.slug) || []),
    }))
    .filter((s) => s.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map((s) => s.post)
}
