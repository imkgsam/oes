import { loadSync } from '@grpc/proto-loader'
import { resolveCommonContractPath, resolveCommonProtoPath } from '@oes/common/contracts'

// Verifies the permission-service gRPC proto graph can be loaded by the live Nest runtime.
describe('permission-service gRPC proto loading', () => {
  it('loads the full permission_service proto set used by main.ts', () => {
    const protoPath = [
      resolveCommonProtoPath('permission_service/permission_check.proto'),
      resolveCommonProtoPath('permission_service/permission_access_summary.proto'),
      resolveCommonProtoPath('permission_service/permission_terminal_access.proto'),
      resolveCommonProtoPath('permission_service/permission_management.proto'),
      resolveCommonProtoPath('permission_service/resource_authorization.proto'),
      resolveCommonProtoPath('permission_service/policy_instance_management.proto'),
      resolveCommonProtoPath('permission_service/policy_instance_preview.proto'),
      resolveCommonProtoPath('permission_service/policy_management.proto')
    ]

    expect(() =>
      loadSync(protoPath, {
        includeDirs: [
          resolveCommonContractPath(),
          resolveCommonContractPath('permission_service')
        ]
      })
    ).not.toThrow()
  })
})
