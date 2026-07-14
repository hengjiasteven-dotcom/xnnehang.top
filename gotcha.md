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

## Sätteri Plugins Cannot Mutate the AST via JS Splice

Sätteri keeps the markdown AST in a Rust memory arena; the JS nodes passed to plugin handlers are read-only proxies. Calling `parent.children.splice()` (the standard remark pattern) silently does nothing — the Rust tree is unchanged and the original text passes through unmodified. To replace a node in an mdast plugin, return `{ raw: "..." }` (re-parsed markdown) or a structured node from the handler. To mutate in-place, use `ctx.replaceNode()`, `ctx.insertAfter()`, `ctx.setProperty()`, etc. — these write to a command buffer that the Rust side applies after the pass. The same applies to hast plugins: use `ctx.setProperty()` and return values, not direct property assignment.

## PR Body Must Follow the Pull Request Template

Before running `gh pr create`, read `.github/PULL_REQUEST_TEMPLATE.md` and fill every section. The template defines three required sections:

1. **动机** — describe what changed and why; link related issues with `fixes #N`, `closes #N`, or `related to #N`
2. **解决方案** — explain the approach, especially for non-trivial changes
3. **类型** — check at least one box by changing `[ ]` to `[x]`; use GitHub emoji syntax (`:bug:`, `:sparkles:`, etc.) exactly as shown in the template

Do **not** delete the template structure or write a freeform PR body. The comment at the top says so explicitly.

The template is only in the `xnnehang.top` repo (`.github/PULL_REQUEST_TEMPLATE.md`); fetch it with `gh api` if you cannot read it locally.

## Submodule: Pull Instead of Copy + Push

The image submodule (`src/assets/img`) is shared between the Obsidian source repo (`obsidan/xnnehang.top.factory`) and the blog project (`nyakku.moe`). **Never** copy files into the submodule manually and commit there — the user handles image uploads from the Obsidian side. If new images are needed, simply run:

```
git submodule update --init --recursive
```

to pull the latest state from the remote. An unnecessary submodule commit will cause a push conflict with the other repo.

## Proxy Not Inherited from System Settings

Windows system proxy is NOT automatically inherited by the CLI environment. `$env:HTTP_PROXY` and `$env:HTTPS_PROXY` are empty by default even when the system proxy (e.g., `127.0.0.1:3067`) is enabled. Before any `git fetch`, `git push`, or `curl` to remote, explicitly set:

```
$env:HTTP_PROXY="http://127.0.0.1:3067"
$env:HTTPS_PROXY="http://127.0.0.1:3067"
```

## PowerShell UTF-8 Encoding for Chinese Files

PowerShell's `Get-Content` defaults to the system's ANSI encoding (e.g., GBK on Chinese Windows), garbling Chinese characters in markdown files. **Always** use the .NET method for reliable UTF-8 reading:

```powershell
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
```

Or use `Get-Content -Encoding UTF8` if the file has a BOM. For files without BOM (which is common), the .NET method is the safest.

## Only Sync Explicitly Requested Articles

When working on blog posts: only touch the files that the user explicitly asks to sync or create. Do not "improve", "fix", "normalize", or "sync" any other files in `src/content/posts/` — even if you notice missing fields, format inconsistencies, or other issues in unrelated articles. If the user says "only do X and Y", do exactly X and Y; anything else is a bug.

## Prefer Directive Syntax for Admonitions

Use `:::note[Title]` (directive syntax) instead of `> [!NOTE] Title` (GitHub syntax) for admonitions. The directive syntax supports custom titles natively via `:::note[My Title]`, and is the preferred convention in this project. Both syntaxes render identically, but directive syntax is cleaner for longer blocks — no `> ` prefix on every line.

## Git-Derived Metadata Needs a Full Clone in CI

Post pages read "last modified" and "revision count" from `git log` at build time (`src/utils/git-utils.ts`). `actions/checkout` defaults to a shallow clone (`fetch-depth: 1`), which silently truncates history: every post then builds with revision count 1 and today's date — no error, just wrong values. Any workflow that runs `astro build` (or anything else touching git history) MUST set `fetch-depth: 0` on its checkout step. Locally the same applies to shallow clones (`git clone --depth`).
