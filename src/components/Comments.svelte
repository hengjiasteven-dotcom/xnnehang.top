<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  const REPO = 'MrXnneHang/xnnehang.top'
  const REPO_ID = 'R_kgDOSusWYQ'
  const CATEGORY = 'Announcements'
  const CATEGORY_ID = 'DIC_kwDOSusWYc4C_HrN'

  let container: HTMLDivElement

  function getTheme(): string {
    const base = document.documentElement.classList.contains('dark')
      ? 'giscus-dark.css'
      : 'giscus-light.css'
    return `${window.location.origin}/${base}`
  }

  function loadGiscus() {
    if (!container) return

    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', REPO)
    script.setAttribute('data-repo-id', REPO_ID)
    script.setAttribute('data-category', CATEGORY)
    script.setAttribute('data-category-id', CATEGORY_ID)
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', getTheme())
    script.setAttribute('data-lang', 'zh-CN')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true
    container.appendChild(script)
  }

  function observeTheme(): MutationObserver {
    const observer = new MutationObserver(() => {
      const iframe = container?.querySelector('.giscus-frame') as
        | HTMLIFrameElement
        | undefined
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            giscus: {
              setConfig: {
                theme: getTheme(),
              },
            },
          },
          'https://giscus.app',
        )
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return observer
  }

  let observer: MutationObserver | null = null

  onMount(() => {
    loadGiscus()
    observer = observeTheme()
  })

  onDestroy(() => {
    observer?.disconnect()
  })
</script>

<div bind:this={container} />
