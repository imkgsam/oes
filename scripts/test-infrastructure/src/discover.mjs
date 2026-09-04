#!/usr/bin/env node
import { resolve } from 'node:path'
import { discoverTests } from './test-infrastructure.mjs'

/** Formats one taxonomy violation for local and CI logs. */
function formatViolation(violation) {
  return `${violation.code} ${violation.path}${violation.message ? `: ${violation.message}` : ''}`
}

const args = new Set(process.argv.slice(2))
const root = resolve(process.cwd())
const result = discoverTests({ root })

if (args.has('--json')) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} else {
  console.log(
    `TEST_DISCOVERY total=${result.total} ${Object.entries(result.counts)
      .map(([type, count]) => `${type}=${count}`)
      .join(' ')}`
  )
  for (const violation of result.violations) console.error(formatViolation(violation))
}

if (result.violations.length) {
  if (!args.has('--json')) console.error(`TEST_DISCOVERY=FAIL violations=${result.violations.length}`)
  process.exitCode = 1
} else if (!args.has('--json')) {
  console.log('TEST_DISCOVERY=PASS')
}
