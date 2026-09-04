import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..', 'storefront', 'src')
const pending = [root]
const tests = []
while (pending.length > 0) {
  const directory = pending.pop()
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry)
    if (statSync(path).isDirectory()) pending.push(path)
    else if (entry.endsWith('.unit.spec.mjs')) tests.push(path)
    else if (/\.(?:spec|test)\.mjs$/u.test(entry)) throw new Error(`Unclassified Node test: ${path}`)
  }
}
if (tests.length === 0) throw new Error('No Storefront Node unit tests discovered')
tests.sort()
const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' })
process.exit(result.status ?? 1)
