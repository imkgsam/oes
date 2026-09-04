import { join } from 'node:path';
import { getPermissionCodeDefinition } from './catalog';
describe('Public Business Card owner-fact permission catalog and workload policy', () => {
    const exactTuples = [
        ['urn:oes:service:hr-service', 'hr.internal.public_business_card_employee.resolve'],
        ['urn:oes:service:identity-service', 'identity.internal.public_business_card_identity.resolve'],
        [
            'urn:oes:service:tenant-org-service',
            'tenant_org.internal.public_business_card_organization.resolve'
        ]
    ] as const;
    it.each(exactTuples)('%s / %s is SYSTEM WORKLOAD_POLICY-only and non-external', (_, code) => {
        expect(getPermissionCodeDefinition(code)).toEqual(expect.objectContaining({
            code,
            kind: 'INTERNAL',
            assignableTo: ['WORKLOAD_POLICY'],
            allowedScopeLevels: ['SYSTEM'],
            externalApiEligible: false
        }));
    });
});
