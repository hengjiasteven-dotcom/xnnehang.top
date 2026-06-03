/* Extract the first image from a post's markdown body */
export function remarkFirstImage() {
  return (tree, { data }) => {
    let found = ''
    const visit = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'image') {
          found = node.url
          return true
        }
        if (node.children?.length) {
          if (visit(node.children)) return true
        }
      }
      return false
    }
    visit(tree.children)
    data.astro.frontmatter.firstImage = found
  }
}
