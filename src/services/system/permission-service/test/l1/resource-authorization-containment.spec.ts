import { readFileSync } from 'fs'
import { resolve } from 'path'
import 'reflect-metadata'
import { CONTROLLERS_METADATA } from '@nestjs/common/constants'
import { AuthorizationModule } from '../../src/modules/authorization/authorization.module'
import { ResourceAuthorizationService } from '../../src/application/authorization/resource-authorization.service'

describe('Resource authorization containment', () => {
  it('ResourceAuthorizationService / 不应通过 controller 暴露 runtime path', () => {
    const controllers = Reflect.getMetadata(CONTROLLERS_METADATA, AuthorizationModule) ?? []

    expect(controllers).not.toContain(ResourceAuthorizationService)
  })

  it('ResourceAuthorizationService / 不应出现在 permission-service proto 契约中', () => {
    const protoDir = resolve(__dirname, '../../../../../common/src/contracts/permission_service')
    const protoContents = [
      'permission_check.proto',
      'policy_management.proto',
      'permission_management.proto',
      'permission_access_summary.proto',
      'permission_terminal_access.proto'
    ].map((file) => readFileSync(resolve(protoDir, file), 'utf8'))

    expect(protoContents.join('\n')).not.toContain('ResourceAuthorizationService')
    expect(protoContents.join('\n')).not.toContain('CheckResource')
    expect(protoContents.join('\n')).not.toContain('BuildQueryScope')
  })
})
