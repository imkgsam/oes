import { join } from 'node:path';
import { getPermissionCodeDefinition } from './catalog';
describe('Auth login owner-fact permission catalog and deployment profile', () => {
    const codes = [
        'hr.internal.auth_login_employee.resolve',
        'identity.internal.auth_login_account.resolve',
        'tenant_org.internal.auth_session_tenant_lifecycle.resolve'
    ];
    it.each(codes)('%s is SYSTEM WORKLOAD_POLICY-only and non-external', (code) => {
        expect(getPermissionCodeDefinition(code)).toEqual(expect.objectContaining({
            code,
            kind: 'INTERNAL',
            assignableTo: ['WORKLOAD_POLICY'],
            allowedScopeLevels: ['SYSTEM'],
            externalApiEligible: false
        }));
    });
});
