import assert from 'node:assert/strict'
import test from 'node:test'
import { checkReproducibleBuild, parseAllowBuilds } from './reproducible-build-check.mjs'

test('workspace policy rejects placeholder and non-boolean allowBuilds entries', () => {
  assert.throws(
    () => parseAllowBuilds('allowBuilds:\n  esbuild: set this to true or false\n'),
    /ALLOW_BUILDS_PLACEHOLDER_PRESENT/
  )
  assert.throws(
    () => parseAllowBuilds('allowBuilds:\n  esbuild: yes\n'),
    /ALLOW_BUILDS_VALUE_INVALID/
  )
})

test('repository build inventory is complete and deterministic', () => {
  let output = ''
  const result = checkReproducibleBuild({
    output: {
      write(chunk) {
        output += chunk
      }
    }
  })
  assert.equal(result.backendPackages.length, 22)
  assert.equal(result.prismaPackages.length, 21)
  assert.equal(result.workspacePackages.has('@oes/meilong-ceramics-site-runtime'), true)
  assert.equal(result.workspacePackages.has('@oes/meilong-ceramics-site-storefront'), true)
  assert.match(output, /REPRODUCIBLE_BUILD_CHECK=PASS/)
})
