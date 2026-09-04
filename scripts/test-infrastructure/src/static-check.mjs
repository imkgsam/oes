#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  discoverPackages,
  discoverTests,
  findOwner,
  normalizePath,
  walkFiles
} from './test-infrastructure.mjs'

const staticCheckPattern = /\.static\.check\.(?:cjs|mjs|js|ts)$/

/** Parses the small CLI surface shared by local and CI invocation. */
function parseArguments(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) continue
    const [key, inline] = argument.slice(2).split('=', 2)
    values[key] = inline ?? (argv[index + 1]?.startsWith('--') ? 'true' : argv[++index] || 'true')
  }
  return values
}

/** Validates relative Markdown links in changed documents without crawling external URLs. */
function checkMarkdownLinks(root, paths) {
  const failures = []
  for (const path of paths.filter((item) => item.endsWith('.md') && existsSync(resolve(root, item)))) {
    const source = readFileSync(resolve(root, path), 'utf8')
    const links = [...source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1])
    for (const rawLink of links) {
      const link = rawLink.split('#', 1)[0].trim()
      if (!link || /^(?:[a-z]+:|#|\/)/i.test(link)) continue
      const target = resolve(root, dirname(path), decodeURIComponent(link))
      if (!existsSync(target)) failures.push(`${path} -> ${rawLink}`)
    }
  }
  return failures
}

/** Runs one repository static rule using Node's native TypeScript stripping when needed. */
export function runStaticRule(root, path, options = {}) {
  const args = extname(path) === '.ts'
    ? ['--experimental-strip-types', '--test', path]
    : ['--test', path]
  // A nested Node test process must not inherit the parent's private test-runner
  // context; doing so can make a failing child report exit 0 to the parent.
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: options.stdio || 'inherit'
  })
  return result.status ?? 1
}

/** Executes every selected rule and retains every non-zero result for fail-closed aggregation. */
export function runStaticRules(root, paths, options = {}) {
  return paths.flatMap((path) => {
    const status = runStaticRule(root, normalizePath(path), options)
    return status === 0 ? [] : [`STATIC_RULE_FAILED ${path} exit=${status}`]
  })
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv)
  const root = resolve(args.root || process.cwd())
  const packages = discoverPackages(root)
  const discovery = discoverTests({ root, packages })
  const failures = discovery.violations.map(
    (violation) => `${violation.code} ${violation.path}${violation.message ? `: ${violation.message}` : ''}`
  )
  let changedPaths = []
  let ownerNames = null
  let mode = args.mode || 'FULL'

  if (args.plan) {
    const plan = JSON.parse(readFileSync(resolve(args.plan), 'utf8'))
    changedPaths = plan.changes.flatMap((change) => [change.oldPath, change.path]).filter(Boolean)
    ownerNames = new Set(plan.owners.map((owner) => owner.name))
    mode = plan.mode
  }

  for (const brokenLink of checkMarkdownLinks(root, changedPaths)) failures.push(`BROKEN_DOC_LINK ${brokenLink}`)

  const rules = walkFiles(root)
    .filter((path) => staticCheckPattern.test(path))
    .filter((path) => {
      if (!ownerNames || mode === 'FULL' || path.startsWith('checks/')) return true
      const owner = findOwner(path, packages)
      return owner && ownerNames.has(owner.name)
    })
    .sort()

  failures.push(...runStaticRules(root, rules))

  if (failures.length) {
    for (const failure of failures) console.error(failure)
    console.error(`STATIC_CHECK=FAIL rules=${rules.length} violations=${failures.length}`)
    return 1
  }

  console.log(`STATIC_CHECK=PASS rules=${rules.length} tests=${discovery.total}`)
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  process.exitCode = main()
}
