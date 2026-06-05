export interface GraphNode {
  id: string
  title: string
  linkCount: number
}

export interface GraphLink {
  source: string
  target: string
}

export interface SerializedGraph {
  nodes: GraphNode[]
  links: GraphLink[]
}