import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'fs'
import { resolve } from 'path'
import 'reflect-metadata'

describe('Resource authorization containment', () => {
  it('ResourceAuthorizationService / 应只通过专用 gRPC controller 暴露 runtime path', () => {
    const moduleSource = readFileSync(
      resolve(__dirname, '../../src/modules/authorization/authorization.module.ts'),
      'utf8'
    )
    const controllersBlock = moduleSource.match(/controllers:\s*\[[\s\S]*?\]/)?.[0] ?? ''

    expect(moduleSource).toContain('ResourceAuthorizationGrpcController')
    expect(controllersBlock).toContain('ResourceAuthorizationGrpcController')
    expect(controllersBlock).not.toContain('ResourceAuthorizationService')
  })

  it('ResourceAuthorizationService / 应只出现在专用 resource_authorization proto 中', () => {
    const protoDir = resolve(__dirname, '../../../../../common/src/contracts/permission_service')
    const runtimeProto = readFileSync(resolve(protoDir, 'resource_authorization.proto'), 'utf8')
    const legacyProtoContents = [
      'permission_check.proto',
      'policy_management.proto',
      'permission_management.proto',
      'permission_access_summary.proto',
      'permission_terminal_access.proto'
    ].map((file) => readFileSync(resolve(protoDir, file), 'utf8'))

    expect(runtimeProto).toContain('service ResourceAuthorizationService')
    expect(runtimeProto).toContain('rpc CheckResource')
    expect(runtimeProto).toContain('rpc BuildQueryScope')
    expect(legacyProtoContents.join('\n')).not.toMatch(/service\s+ResourceAuthorizationService\b/)
    expect(legacyProtoContents.join('\n')).not.toMatch(/rpc\s+CheckResource\b/)
    expect(legacyProtoContents.join('\n')).not.toMatch(/rpc\s+BuildQueryScope\b/)
  })
})
