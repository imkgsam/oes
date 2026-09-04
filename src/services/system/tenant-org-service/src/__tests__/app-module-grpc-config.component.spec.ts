import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { TenantOrgAuthTrustedGrpcClient, TenantOrgHrTrustedGrpcClient, TenantOrgIdentityTrustedGrpcClient, TenantOrgPermissionTrustedGrpcClient } from '../infrastructure/adapters/foundation-trusted-grpc.clients';
import { AuthLoginOnboardingGrpcAdapter } from '../infrastructure/adapters/auth-login-onboarding.grpc.adapter';
import { AuthSessionRevocationGrpcAdapter } from '../infrastructure/adapters/auth-session-revocation.grpc.adapter';
import { HrEmployeeOnboardingGrpcAdapter } from '../infrastructure/adapters/hr-employee-onboarding.grpc.adapter';
import { IdentityAccountOnboardingGrpcAdapter } from '../infrastructure/adapters/identity-account-onboarding.grpc.adapter';
import { PermissionTenantOnboardingGrpcAdapter } from '../infrastructure/adapters/permission-tenant-onboarding.grpc.adapter';
import { TenantOrgTrustedExecutionModule } from '../modules/tenant-org-trusted-execution.module';
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
        }).compile();
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
        ])
            expect(moduleRef.get(token)).toBeDefined();
        await moduleRef.close();
    });
});
