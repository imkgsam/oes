import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const adminRoot = resolve(root, 'apps/tenant-web/src/views/admin')
const pending = [adminRoot]
const vueFiles = []
while (pending.length > 0) {
  const directory = pending.pop()
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry)
    if (statSync(path).isDirectory()) pending.push(path)
    else if (path.endsWith('.vue')) vueFiles.push(path)
  }
}
const violations = []
for (const file of vueFiles) {
  const source = readFileSync(file, 'utf8')
  if (/<table\b/u.test(source)) violations.push(`${relative(root, file)} uses raw <table>`)
  if (/table-action-dropdown|TableActionDropdown|renderTableActionDropdown|createTableActionColumn/u.test(source)) {
    violations.push(`${relative(root, file)} uses retired table action wrapper`)
  }
}
assert.deepEqual(violations, [], violations.join('\n'))
console.log(`tenant-web static table checks passed (${vueFiles.length} Vue files)`)
