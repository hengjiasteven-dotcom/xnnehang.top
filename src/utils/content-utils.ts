import { type CollectionEntry, getCollection } from 'astro:content'
import I18nKey from '@i18n/i18nKey'
import { i18n } from '@i18n/translation'
import { getCategoryUrl } from '@utils/url-utils.ts'

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
  const allBlogPosts = await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const sorted = allBlogPosts.sort((a, b) => {
    const dateA = new Date(a.data.published)
    const dateB = new Date(b.data.published)
    return dateA > dateB ? -1 : 1
  })
  return sorted
}

export async function getSortedPosts() {
  const sorted = await getRawSortedPosts()

  for (let i = 1; i < sorted.length; i++) {
    sorted[i].data.nextSlug = sorted[i - 1].id
    sorted[i].data.nextTitle = sorted[i - 1].data.title
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    sorted[i].data.prevSlug = sorted[i + 1].id
    sorted[i].data.prevTitle = sorted[i + 1].data.title
  }

  return sorted
}
export type PostForList = {
  slug: string
  data: CollectionEntry<'posts'>['data']
}
export async function getSortedPostsList(): Promise<PostForList[]> {
  const sortedFullPosts = await getRawSortedPosts()

  // delete post.body
  const sortedPostsList = sortedFullPosts.map((post) => ({
    slug: post.id,
    data: post.data,
  }))

  return sortedPostsList
}
export type Tag = {
  name: string
  count: number
}

export async function getTagList(): Promise<Tag[]> {
  const allBlogPosts = await getCollection<'posts'>('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const countMap: { [key: string]: number } = {}
  allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
    post.data.tags.forEach((tag: string) => {
      if (!countMap[tag]) countMap[tag] = 0
      countMap[tag]++
    })
  })

  // sort tags
  const keys: string[] = Object.keys(countMap).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  return keys.map((key) => ({ name: key, count: countMap[key] }))
}

export type Category = {
  name: string
  count: number
  url: string
}

export type Series = {
  name: string
  posts: CollectionEntry<'posts'>[]
}

export async function getCategoryList(): Promise<Category[]> {
  const allBlogPosts = await getCollection<'posts'>('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })
  const count: { [key: string]: number } = {}
  allBlogPosts.forEach((post: { data: { category: string | null } }) => {
    if (!post.data.category) {
      const ucKey = i18n(I18nKey.uncategorized)
      count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1
      return
    }

    const categoryName =
      typeof post.data.category === 'string'
        ? post.data.category.trim()
        : String(post.data.category).trim()

    count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1
  })

  const lst = Object.keys(count).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  const ret: Category[] = []
  for (const c of lst) {
    ret.push({
      name: c,
      count: count[c],
      url: getCategoryUrl(c),
    })
  }
  return ret
}

export async function getSeriesList(): Promise<Series[]> {
  const allBlogPosts = await getCollection<'posts'>('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  const seriesMap: Map<string, PostForList[]> = new Map()
  allBlogPosts.forEach((post) => {
    const names = post.data.series || []
    names.forEach((name) => {
      if (!seriesMap.has(name)) seriesMap.set(name, [])
      seriesMap.get(name)!.push(post)
    })
  })

  // Sort posts within each series by published date (ascending)
  for (const [, posts] of seriesMap) {
    posts.sort((a, b) => {
      return new Date(a.data.published).getTime() - new Date(b.data.published).getTime()
    })
  }

  // Sort series by their newest post date
  const sorted = Array.from(seriesMap.entries())
    .map(([name, posts]) => ({ name, posts }))
    .sort((a, b) => {
      const aDate = new Date(a.posts[a.posts.length - 1]?.data.published ?? 0).getTime()
      const bDate = new Date(b.posts[b.posts.length - 1]?.data.published ?? 0).getTime()
      return bDate - aDate
    })

  return sorted
}
