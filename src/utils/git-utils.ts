import { execFileSync } from 'node:child_process'

export type GitFileInfo = {
  lastModified: Date | null
  editCount: number
}

const EMPTY: GitFileInfo = { lastModified: null, editCount: 0 }

let infoMap: Map<string, GitFileInfo> | null = null

function normalize(p: string): string {
  return p.replaceAll('\\', '/')
}

// One `git log` walk for the whole posts directory instead of a subprocess
// per file (~300ms each). Renames are chained newest→oldest so a moved file
// keeps the history of its previous paths.
function buildInfoMap(): Map<string, GitFileInfo> {
  const map = new Map<string, GitFileInfo>()
  let output = ''
  try {
    output = execFileSync(
      'git',
      [
        '-c',
        'core.quotepath=false',
        'log',
        '--format=%x01%cI',
        '--name-status',
        '-M',
        '--',
        'src/content/posts',
      ],
      { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
    )
  } catch {
    return map // git unavailable or not a repo → callers get EMPTY
  }

  const aliasToCurrent = new Map<string, string>()
  let date: string | null = null
  for (const rawLine of output.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line) continue
    if (line.startsWith('\x01')) {
      date = line.slice(1)
      continue
    }
    if (!date) continue
    const parts = line.split('\t')
    const status = parts[0]
    const isRename = status.startsWith('R') || status.startsWith('C')
    const touched = normalize((isRename ? parts[2] : parts[1]) ?? '')
    if (!touched) continue
    const current = aliasToCurrent.get(touched) ?? touched
    aliasToCurrent.set(touched, current)
    const rec = map.get(current)
    if (rec) {
      rec.editCount += 1
    } else {
      map.set(current, { lastModified: new Date(date), editCount: 1 })
    }
    if (isRename) {
      aliasToCurrent.set(normalize(parts[1]), current)
    }
  }
  return map
}

/**
 * Git history info for a post file: date of the latest commit touching it and
 * how many commits touched it (creation included). Uncommitted files get
 * `{ lastModified: null, editCount: 0 }` — hide the display in that case.
 *
 * Computed once per process; in dev the values are stale until the server
 * restarts. CI builds need a full clone (`fetch-depth: 0`), see gotcha.md.
 *
 * @param filePath path relative to the repo root, e.g. `src/content/posts/foo.md`
 */
export function getGitFileInfo(filePath: string | undefined): GitFileInfo {
  if (!filePath) return EMPTY
  if (!infoMap) infoMap = buildInfoMap()
  return infoMap.get(normalize(filePath)) ?? EMPTY
}
