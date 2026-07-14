<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->

## Gotchas

Known pitfalls are documented in [gotcha.md](./gotcha.md). Skim this index; open the linked entry only when your task touches that area:

- **Image filenames with spaces** — never rename or URL-encode; use Markdown angle-bracket syntax `![alt](<path with spaces>)`. → [details](./gotcha.md#astro-markdown-images)
- **HTML `<img>` with local assets** — Astro won't resolve relative paths in raw `<img>` tags; wrap a Markdown image in a styled block element instead. → [details](./gotcha.md#html-img-tag-restriction-for-astro-images)
- **Heading depths in posts** — content headings start at `##`; a stray `#` breaks TOC depth filtering. → [details](./gotcha.md#markdown-heading-depths-for-toc)
- **Adding i18n keys** — `Translation` is a mapped type over `I18nKey`; a new key must be added to all 10 files in `src/i18n/languages/`. → [details](./gotcha.md#i18n-keys-require-all-language-files)
- **Sätteri plugin AST mutation** — JS nodes are read-only proxies; `parent.children.splice()` silently does nothing. Use `{ raw: "..." }` returns or `ctx.replaceNode()`/`ctx.setProperty()`. → [details](./gotcha.md#sätteri-plugins-cannot-mutate-the-ast-via-js-splice)
- **Git-derived post metadata in CI** — builds read `git log`; workflows running `astro build` need `fetch-depth: 0` or values are silently wrong. → [details](./gotcha.md#git-derived-metadata-needs-a-full-clone-in-ci)
- **PR body must follow the template** — read `.github/PULL_REQUEST_TEMPLATE.md` before `gh pr create`; fill 动机/解决方案/类型 and check at least one type box. → [details](./gotcha.md#pr-body-must-follow-the-pull-request-template)
- **Submodule: pull don't copy+push** — don't manually commit into the image submodule; the user handles that from Obsidian side. Just `git submodule update`. → [details](./gotcha.md#submodule-pull-instead-of-copy--push)
- **Proxy not inherited by CLI** — system proxy doesn't auto-flow to terminal; explicitly set `$env:HTTP_PROXY` before remote ops. → [details](./gotcha.md#proxy-not-inherited-from-system-settings)
- **PowerShell UTF-8 encoding** — `Get-Content` defaults to ANSI on Chinese Windows, garbling Chinese. Use `[System.IO.File]::ReadAllText` instead. → [details](./gotcha.md#powershell-utf-8-encoding-for-chinese-files)
- **Only sync explicitly requested articles** — if user says "only do X and Y", don't touch anything else. → [details](./gotcha.md#only-sync-explicitly-requested-articles)
- **Prefer `:::` directive syntax for admonitions** — use `:::note[Title]` instead of `> [!NOTE] Title`; cleaner for long blocks, native custom title support. → [details](./gotcha.md#prefer-directive-syntax-for-admonitions)
