import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkReproducibleBuild,
  parseAllowBuilds,
  validateRootTsconfigReferences,
  validateWorkspacePackageEntries
} from './reproducible-build-check.mjs'

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

test('workspace policy requires the Site Runtime image native build', () => {
  const withoutSharp = `allowBuilds:
  '@nestjs/core': false
  '@parcel/watcher': true
  '@prisma/client': true
  '@prisma/engines': true
  '@scarf/scarf': false
  '@swc/core': true
  bcrypt: true
  esbuild: true
  grpc-tools: true
  prisma: true
  protobufjs: false
`
  assert.throws(() => parseAllowBuilds(withoutSharp), /dependency=sharp expected=true/)
})

test('workspace inventory rejects a missing expected package path', () => {
  assert.throws(
    () =>
      validateWorkspacePackageEntries(
        [{ name: 'api-gateway', path: '/repo/src/services/api-gateway' }],
        [
          { name: 'api-gateway', directory: '/repo/src/services/api-gateway' },
          { name: 'auth-service', directory: '/repo/src/services/system/auth-service' }
        ],
        '/repo'
      ),
    /WORKSPACE_PACKAGE_MISSING name=auth-service path=src\/services\/system\/auth-service/
  )
})

test('workspace inventory rejects duplicate package names before matching paths', () => {
  assert.throws(
    () =>
      validateWorkspacePackageEntries(
        [
          { name: 'crm-service', path: '/repo/src/services/business/crm-service' },
          { name: 'crm-service', path: '/repo/src/services/system/auth-service' }
        ],
        [{ name: 'crm-service', directory: '/repo/src/services/business/crm-service' }],
        '/repo'
      ),
    /WORKSPACE_PACKAGE_NAME_DUPLICATE name=crm-service/
  )
})

test('root TypeScript references reject duplicate package paths', () => {
  assert.throws(
    () =>
      validateRootTsconfigReferences([
        { path: './src/common' },
        { path: './src/services/system/auth-service' },
        { path: './src/services/system/auth-service' }
      ]),
    /ROOT_TSC_REFERENCE_DUPLICATE path=src\/services\/system\/auth-service/
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
