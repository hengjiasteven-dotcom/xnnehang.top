<script lang="ts">
import { onMount } from 'svelte'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import type { SerializedGraph, GraphNode, GraphLink } from '@/types/graph'

interface Props {
  mode?: 'full' | 'mini'
  currentSlug?: string
  graphData?: SerializedGraph | null
}

let { mode = 'full', currentSlug = '', graphData = null }: Props = $props()

// --- State ---
let container: HTMLDivElement | undefined = $state(undefined)
let width = $state(800)
let height = $state(mode === 'mini' ? 300 : 600)
let dark = $state(false)
let showIsolated = $state(false)

// Simulation results
let simNodes: SimNode[] = $state([])
let simLinks: SimLink[] = $state([])

// Pan & zoom (full mode only)
let scale = $state(1)
let translateX = $state(0)
let translateY = $state(0)
let isPanning = $state(false)
let panStart = { x: 0, y: 0 }

// Hover state
let hoveredNodeId: string | null = $state(null)

// --- Types for d3 simulation ---
interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
}

interface SimLink {
  source: SimNode
  target: SimNode
}

// --- Derived ---
let maxLinks = $derived(Math.max(...(simNodes.length ? simNodes.map(n => n.linkCount) : [1]), 1))

// --- Helpers ---
function getRadius(node: GraphNode, maxLinks: number): number {
  const minR = mode === 'mini' ? 5 : 6
  const maxR = mode === 'mini' ? 12 : 16
  if (maxLinks <= 0) return minR
  return minR + (node.linkCount / maxLinks) * (maxR - minR)
}

function getPostUrl(slug: string): string {
  return `/posts/${slug}/`
}

function isConnectedToHovered(nodeId: string): boolean {
  if (!hoveredNodeId) return true
  if (nodeId === hoveredNodeId) return true
  for (const link of simLinks) {
    if (
      (link.source.id === hoveredNodeId && link.target.id === nodeId) ||
      (link.target.id === hoveredNodeId && link.source.id === nodeId)
    ) return true
  }
  return false
}

function isLinkConnectedToHovered(link: SimLink): boolean {
  if (!hoveredNodeId) return true
  return link.source.id === hoveredNodeId || link.target.id === hoveredNodeId
}

// --- Simulation ---
function runSimulation(graph: SerializedGraph) {
  // Filter isolated nodes in full mode unless showIsolated is true
  let filteredNodes = graph.nodes
  let filteredLinks = graph.links
  if (mode === 'full' && !showIsolated) {
    const connectedIds = new Set<string>()
    for (const link of graph.links) {
      connectedIds.add(link.source)
      connectedIds.add(link.target)
    }
    filteredNodes = graph.nodes.filter(n => connectedIds.has(n.id))
    filteredLinks = graph.links.filter(l =>
      connectedIds.has(l.source) && connectedIds.has(l.target)
    )
  }

  if (filteredNodes.length === 0) {
    simNodes = []
    simLinks = []
    return
  }

  const nodes: SimNode[] = filteredNodes.map(n => ({
    ...n,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
  }))

  const links = filteredLinks.map(l => ({
    source: l.source,
    target: l.target,
  }))

  const maxLinks = Math.max(...nodes.map(n => n.linkCount), 1)
  const chargeStrength = mode === 'mini' ? -100 : -150
  const linkDist = mode === 'mini' ? 60 : 80

  const simulation = forceSimulation(nodes)
    .force('link', forceLink(links).id((d: any) => d.id).distance(linkDist))
    .force('charge', forceManyBody().strength(chargeStrength))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide().radius((d: any) => getRadius(d, maxLinks) + 4))
    .alphaDecay(0.02)
    .stop()

  // Run synchronously
  const ticks = mode === 'mini' ? 200 : 300
  simulation.tick(ticks)

  simNodes = nodes
  simLinks = simulation.force<any>('link')!.links() as SimLink[]
}

// --- Fetch full graph data ---
async function loadFullGraph() {
  try {
    const res = await fetch('/graph-data.json')
    const data: SerializedGraph = await res.json()
    runSimulation(data)
  } catch (e) {
    console.error('Failed to load graph data:', e)
  }
}

// --- Lifecycle ---
onMount(() => {
  dark = document.documentElement.classList.contains('dark')

  // Watch dark mode changes
  const observer = new MutationObserver(() => {
    dark = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // Observe container size
  if (container) {
    const rect = container.getBoundingClientRect()
    if (rect.width > 0) width = rect.width
    if (mode === 'full' && rect.height > 0) height = Math.max(rect.height, 500)

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        width = entry.contentRect.width
        if (mode === 'full') {
          height = Math.max(entry.contentRect.height, 500)
        }
      }
    })
    ro.observe(container)
  }

  // Load data
  if (mode === 'mini' && graphData) {
    runSimulation(graphData)
  } else if (mode === 'full') {
    // Delay slightly to ensure container has layout dimensions
    setTimeout(() => {
      if (container) {
        const rect = container.getBoundingClientRect()
        if (rect.width > 0) width = rect.width
        if (rect.height > 0) height = Math.max(rect.height, 500)
      }
      loadFullGraph()
    }, 50)
  }

  mounted = true
  return () => observer.disconnect()
})

// Re-run simulation when showIsolated changes (full mode)
let mounted = false
$effect(() => {
  // Track showIsolated reactively
  const _ = showIsolated
  if (mode === 'full' && mounted) {
    loadFullGraph()
  }
})

// --- Pan/Zoom handlers (full mode) ---
function onWheel(e: WheelEvent) {
  if (mode !== 'full') return
  e.preventDefault()
  const factor = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(Math.max(scale * factor, 0.25), 3)
  // Zoom toward cursor
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  translateX = cx - (cx - translateX) * (newScale / scale)
  translateY = cy - (cy - translateY) * (newScale / scale)
  scale = newScale
}

function onPointerDown(e: PointerEvent) {
  if (mode !== 'full') return
  if ((e.target as HTMLElement).closest('a')) return
  isPanning = true
  panStart = { x: e.clientX - translateX, y: e.clientY - translateY }
}

function onPointerMove(e: PointerEvent) {
  if (!isPanning) return
  translateX = e.clientX - panStart.x
  translateY = e.clientY - panStart.y
}

function onPointerUp() {
  isPanning = false
}
</script>

<div
  bind:this={container}
  class="graph-container relative w-full overflow-hidden rounded-xl {mode === 'full' ? 'min-h-[70vh]' : 'h-[280px]'} {dark ? 'bg-white/[0.04] ring-1 ring-white/[0.06]' : 'bg-neutral-50 shadow-inner'}"
>
  {#if simNodes.length === 0}
    <div class="flex h-full w-full items-center justify-center text-sm {dark ? 'text-white/40' : 'text-black/40'}">
      暂无引用关系
    </div>
  {:else}
    <!-- Controls (full mode only) -->
    {#if mode === 'full'}
      <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
        <label class="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition {dark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'}">
          <input type="checkbox" bind:checked={showIsolated} class="h-3 w-3 accent-[oklch(0.6_0.15_var(--hue,210))]" />
          显示孤立节点
        </label>
      </div>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <svg
      {width}
      {height}
      viewBox="0 0 {width} {height}"
      class="block w-full {mode === 'full' ? 'cursor-grab' : ''}"
      class:cursor-grabbing={isPanning}
      onwheel={onWheel}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointerleave={onPointerUp}
    >
      <g transform="translate({translateX},{translateY}) scale({scale})">
        <!-- Edges -->
        {#each simLinks as link}
          <line
            x1={link.source.x}
            y1={link.source.y}
            x2={link.target.x}
            y2={link.target.y}
            stroke={dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
            stroke-width={isLinkConnectedToHovered(link) && hoveredNodeId ? 1.5 : 0.8}
            opacity={isLinkConnectedToHovered(link) || !hoveredNodeId ? 1 : 0.15}
            class="transition-opacity duration-150"
          />
        {/each}

        <!-- Nodes -->
        {#each simNodes as node}
          {@const r = getRadius(node, maxLinks)}
          {@const isCurrent = node.id === currentSlug}
          {@const isConnected = isConnectedToHovered(node.id)}
          <a
            href={getPostUrl(node.id)}
            class="outline-none"
            onmouseenter={() => hoveredNodeId = node.id}
            onmouseleave={() => hoveredNodeId = null}
          >
            <!-- main circle -->
            <circle
              cx={node.x}
              cy={node.y}
              r={hoveredNodeId === node.id ? r + 2 : r}
              fill={isCurrent
                ? (dark ? '#a78bfa' : '#8b5cf6')
                : (dark ? '#7dd3fc' : '#38bdf8')
              }
              opacity={isConnected || !hoveredNodeId ? 1 : 0.2}
              stroke={isCurrent
                ? (dark ? '#c4b5fd' : '#a78bfa')
                : (dark ? '#bae6fd' : '#7dd3fc')
              }
              stroke-width={hoveredNodeId === node.id || isCurrent ? 2.5 : 1.5}
              class="transition-all duration-200"
            />
            {#if mode === 'mini' || scale > 0.5}
              <text
                x={node.x}
                y={node.y + r + 14}
                text-anchor="middle"
                font-size={hoveredNodeId === node.id ? '13' : (mode === 'mini' ? '11' : '10')}
                font-weight={hoveredNodeId === node.id || isCurrent ? '600' : '500'}
                fill={dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'}
                opacity={hoveredNodeId === node.id || isCurrent ? 1 : (isConnected || !hoveredNodeId ? 0.4 : 0.15)}
                class="pointer-events-none select-none transition-opacity duration-150"
                style="font-family: 'Roboto', system-ui, sans-serif"
              >
                {hoveredNodeId === node.id || isCurrent ? node.title : (node.title.length > 10 ? node.title.slice(0, 10) + '…' : node.title)}
              </text>
            {/if}
          </a>
        {/each}
      </g>
    </svg>
  {/if}
</div>
