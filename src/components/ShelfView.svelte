<script lang="ts">
import { onMount } from 'svelte'

interface ShelfItem {
  id: string
  title: string
  shelf: string
  subCategory: string[]
  blurb: string
  cover: string
  url: string
  published: string
  arxiv: string
}

interface Props {
  items: ShelfItem[]
}

let { items = [] }: Props = $props()

// --- State ---
let activeCategory: string = $state('')
let activeSubCategory: string = $state('')

// --- Derived ---
const categories = ['书籍', '漫画', '游戏', '电影', '电视剧', '动漫', '论文']

let availableCategories = $derived(
  categories.filter(c => items.some(item => item.shelf === c))
)

// Set initial active category
$effect(() => {
  if (!activeCategory && availableCategories.length > 0) {
    activeCategory = availableCategories[0]
  }
})

let categoryItems = $derived(
  items.filter(item => item.shelf === activeCategory)
)

// Collect unique subCategories for current category
let availableSubCategories = $derived.by(() => {
  const subs = new Set<string>()
  for (const item of categoryItems) {
    for (const sub of item.subCategory) {
      subs.add(sub)
    }
  }
  return Array.from(subs).sort()
})

let filteredItems = $derived(
  activeSubCategory
    ? categoryItems.filter(item => item.subCategory.includes(activeSubCategory))
    : categoryItems
)

function selectCategory(cat: string) {
  activeCategory = cat
  activeSubCategory = ''
}

function selectSubCategory(sub: string) {
  activeSubCategory = activeSubCategory === sub ? '' : sub
}
</script>

<div class="flex w-full flex-col gap-6 lg:flex-row lg:gap-8">
  <!-- Left sidebar nav -->
  <nav class="shrink-0 lg:w-[160px]">
    <div class="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
      {#each availableCategories as cat}
        <button
          class="rounded-lg px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition
            {activeCategory === cat
              ? 'bg-[oklch(0.55_0.16_55)] text-white shadow-sm dark:bg-[oklch(0.65_0.18_55)]'
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70'}"
          onclick={() => selectCategory(cat)}
        >
          <span>{cat}</span>
          <span class="ml-1 opacity-60">{items.filter(i => i.shelf === cat).length}</span>
        </button>
      {/each}
    </div>
  </nav>

  <!-- Main content -->
  <div class="min-w-0 flex-1">
    <!-- Category header -->
    <div class="mb-4">
      <p class="mb-1 text-xs font-medium tracking-wider uppercase text-black/30 dark:text-white/30">Collection</p>
      <h2 class="text-2xl font-bold text-black/90 dark:text-white/90">{activeCategory}</h2>
      <p class="mt-1 text-sm text-black/50 dark:text-white/50">{categoryItems.length} 部作品</p>
    </div>

    <!-- Sub-category filters -->
    {#if availableSubCategories.length > 0}
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          class="rounded-full px-3 py-1 text-xs font-medium transition
            {activeSubCategory === ''
              ? 'bg-[oklch(0.55_0.16_55)] text-white dark:bg-[oklch(0.65_0.18_55)]'
              : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'}"
          onclick={() => activeSubCategory = ''}
        >
          全部
        </button>
        {#each availableSubCategories as sub}
          <button
            class="rounded-full px-3 py-1 text-xs font-medium transition
              {activeSubCategory === sub
                ? 'bg-[oklch(0.55_0.16_55)] text-white dark:bg-[oklch(0.65_0.18_55)]'
                : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'}"
            onclick={() => selectSubCategory(sub)}
          >
            {sub}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Items -->
    {#if activeCategory === '论文'}
      <!-- Papers: list layout -->
      <div class="flex flex-col gap-3">
        {#each filteredItems as item, idx}
          <div class="card-base flex flex-col gap-2 rounded-xl p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="shrink-0 text-xs font-medium text-black/30 dark:text-white/30">[{String(idx + 1).padStart(2, '0')}]</span>
                  <a href={item.url} class="font-semibold leading-snug text-black/85 transition hover:text-[oklch(0.55_0.16_55)] dark:text-white/85 dark:hover:text-[oklch(0.7_0.16_55)]">
                    {item.title}
                  </a>
                </div>
                <div class="flex flex-wrap gap-1.5 pl-7">
                  {#each item.subCategory as sub}
                    <span class="rounded bg-black/5 px-1.5 py-0.5 text-xs text-black/50 dark:bg-white/5 dark:text-white/50">{sub}</span>
                  {/each}
                </div>
                {#if item.blurb}
                  <p class="pl-7 text-sm leading-relaxed text-black/60 dark:text-white/60">{item.blurb}</p>
                {/if}
              </div>
              {#if item.arxiv}
                <a
                  href={item.arxiv}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-black/50 transition hover:bg-black/5 hover:text-black/80 dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white/80"
                >
                  arXiv ↗
                </a>
              {/if}
            </div>
            <div class="flex items-center gap-3 pl-7">
              <span class="text-xs text-black/30 dark:text-white/30">{item.published}</span>
              <a href={item.url} class="text-xs text-black/40 transition hover:text-[oklch(0.55_0.16_55)] dark:text-white/40 dark:hover:text-[oklch(0.7_0.16_55)]">阅读笔记 →</a>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <!-- Other categories: grid layout -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {#each filteredItems as item}
          <a
            href={item.url}
            class="group flex flex-col gap-2 overflow-hidden rounded-xl transition active:scale-[0.97]"
          >
            <!-- Cover -->
            <div class="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm transition group-hover:shadow-md dark:bg-neutral-800">
              {#if item.cover}
                <img
                  src={item.cover}
                  alt={item.title}
                  class="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              {:else}
                <div class="flex h-full w-full items-center justify-center p-4">
                  <span class="text-center text-base font-bold leading-snug text-black/60 dark:text-white/70">
                    {item.title}
                  </span>
                </div>
              {/if}
            </div>
            <!-- Title & blurb -->
            <div class="flex flex-col gap-0.5 px-1">
              <span class="line-clamp-2 text-sm font-semibold leading-tight text-black/80 transition group-hover:text-[oklch(0.55_0.16_55)] dark:text-white/85 dark:group-hover:text-[oklch(0.7_0.16_55)]">
                {item.title}
              </span>
              {#if item.blurb}
                <span class="text-50 line-clamp-2 text-xs leading-snug">{item.blurb}</span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}

    {#if filteredItems.length === 0}
      <div class="flex h-40 items-center justify-center text-sm text-black/30 dark:text-white/30">
        暂无内容
      </div>
    {/if}
  </div>
</div>
