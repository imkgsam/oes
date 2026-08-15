import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Test } from '@nestjs/testing'
import {
  TenantOrgAuthTrustedGrpcClient,
  TenantOrgHrTrustedGrpcClient,
  TenantOrgIdentityTrustedGrpcClient,
  TenantOrgPermissionTrustedGrpcClient
} from '../../src/infrastructure/adapters/foundation-trusted-grpc.clients'
import { AuthLoginOnboardingGrpcAdapter } from '../../src/infrastructure/adapters/auth-login-onboarding.grpc.adapter'
import { AuthSessionRevocationGrpcAdapter } from '../../src/infrastructure/adapters/auth-session-revocation.grpc.adapter'
import { HrEmployeeOnboardingGrpcAdapter } from '../../src/infrastructure/adapters/hr-employee-onboarding.grpc.adapter'
import { IdentityAccountOnboardingGrpcAdapter } from '../../src/infrastructure/adapters/identity-account-onboarding.grpc.adapter'
import { PermissionTenantOnboardingGrpcAdapter } from '../../src/infrastructure/adapters/permission-tenant-onboarding.grpc.adapter'
import { TenantOrgTrustedExecutionModule } from '../../src/modules/tenant-org-trusted-execution.module'

/** Locks TenantOrg's production foundation calls to dedicated mTLS client providers. */
describe('tenant-org AppModule gRPC config', () => {
  it('resolves every target-bound adapter and mTLS client through the runtime DI graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TenantOrgTrustedExecutionModule],
      providers: [
        AuthLoginOnboardingGrpcAdapter,
        AuthSessionRevocationGrpcAdapter,
        HrEmployeeOnboardingGrpcAdapter,
        IdentityAccountOnboardingGrpcAdapter,
        PermissionTenantOnboardingGrpcAdapter
      ]
    }).compile()

    for (const token of [
      TenantOrgAuthTrustedGrpcClient,
      TenantOrgHrTrustedGrpcClient,
      TenantOrgIdentityTrustedGrpcClient,
      TenantOrgPermissionTrustedGrpcClient,
      AuthLoginOnboardingGrpcAdapter,
      AuthSessionRevocationGrpcAdapter,
      HrEmployeeOnboardingGrpcAdapter,
      IdentityAccountOnboardingGrpcAdapter,
      PermissionTenantOnboardingGrpcAdapter
    ]) expect(moduleRef.get(token)).toBeDefined()
    await moduleRef.close()
  })

  it('contains no generic foundation registration or plaintext fallback', () => {
    const appSource = readFileSync(join(__dirname, '../../src/app.module.ts'), 'utf8')
    const managementSource = readFileSync(join(__dirname, '../../src/modules/tenant-org-management/tenant-org-management.module.ts'), 'utf8')
    const querySource = readFileSync(join(__dirname, '../../src/modules/tenant-org-query/tenant-org-query.module.ts'), 'utf8')
    const clientsSource = readFileSync(join(__dirname, '../../src/infrastructure/adapters/foundation-trusted-grpc.clients.ts'), 'utf8')
    expect(`${appSource}\n${managementSource}\n${querySource}`).not.toMatch(/GrpcTransportModule\.for(?:Root|Feature)/)
    expect(clientsSource).toMatch(/credentials:\s*createGrpcClientCredentials\(\)/)
  })
})
