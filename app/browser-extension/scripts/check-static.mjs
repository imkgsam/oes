import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')
const observerPath = resolve(root, 'src/runtime/browser-activity-page-observer.ts')
const observerSource = readFileSync(observerPath, 'utf8')
const observerFile = ts.createSourceFile(observerPath, observerSource, ts.ScriptTarget.ES2022, true)
const moduleStatements = observerFile.statements.filter((statement) =>
  ts.isImportDeclaration(statement) ||
  ts.isImportEqualsDeclaration(statement) ||
  ts.isExportAssignment(statement) ||
  ts.isExportDeclaration(statement) ||
  statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
)
assert.deepEqual(moduleStatements, [], 'classic page observer must not contain module syntax')

const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8'))
assert.equal(manifest.manifest_version, 3)
assert.equal(manifest.name, 'OES BE')
assert.equal(manifest.action?.default_title, 'OES BE')
assert.deepEqual(manifest.action?.default_icon, manifest.icons)
for (const permission of ['scripting', 'tabs']) {
  assert.ok(manifest.permissions?.includes(permission), `missing extension permission: ${permission}`)
}
for (const host of ['http://*/*', 'https://*/*', 'http://localhost:9101/*']) {
  assert.ok(manifest.host_permissions?.includes(host), `missing extension host permission: ${host}`)
}
console.log('browser-extension static checks passed')
