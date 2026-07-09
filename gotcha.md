# Gotchas

Project pitfalls collected from real debugging sessions. Indexed from [AGENTS.md](./AGENTS.md) — skim the index there first; read the full entry here only when your task touches that area.

## Astro Markdown Images

When dealing with Astro markdown files, if an image file has spaces in its name (e.g., `Pasted image 123.png`), DO NOT rename the image file or URL encode it. Instead, use the standard Markdown angle bracket syntax to enclose the path: `![alt](<../../assets/img/Pasted image 123.png>)`. Astro requires this format to correctly resolve paths with spaces during the build process.

## HTML img Tag Restriction for Astro Images

Astro's markdown compiler does not resolve or hash relative paths of local image assets inside standard HTML `<img>` tags (e.g. `<img src="../../assets/img/..."/>`). This will result in broken image links in the production build.
To resize or style an image (e.g., limit its width or center it), DO NOT use HTML `<img>` tags. Instead, wrap a standard Markdown image tag inside a block-level HTML element (such as `<div class="img-center" style="max-width: 24rem; margin: 0 auto;">`) and leave blank lines around the Markdown image so the parser parses it correctly:

```html
<div class="img-center" style="max-width: 24rem; margin: 0 auto;">

![alt](../../assets/img/...)

</div>
```

## Markdown Heading Depths for TOC

In markdown blog posts, the `h1` (`#`) is usually reserved for the post title (defined in frontmatter). All content headings MUST start from `h2` (`##`) and go down from there (`###`, `####`). If you use `#` for a section heading, it breaks the TOC (Table of Contents) generation by making the `minDepth` 1, which causes the TOC to filter out `h3` and `h4` headings. When debugging missing headings in the TOC, always check if the file incorrectly uses an `h1` (`#`) in the content.

## i18n Keys Require All Language Files

`Translation` in `src/i18n/translation.ts` is a mapped type over the `I18nKey` enum (`{ [K in I18nKey]: string }`). Adding a key to `src/i18n/i18nKey.ts` breaks type-checking for EVERY language file in `src/i18n/languages/` (10 files: en, zh_CN, zh_TW, ja, ko, es, id, th, tr, vi) until the key is added to each of them. When adding a UI string, update all 10 language files in the same change, then run `astro check` to confirm.
