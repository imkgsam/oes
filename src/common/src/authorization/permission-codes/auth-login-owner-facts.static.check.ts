import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
describe('Auth login owner-fact permission catalog and deployment profile', () => {
    const codes = [
        'hr.internal.auth_login_employee.resolve',
        'identity.internal.auth_login_account.resolve',
        'tenant_org.internal.auth_session_tenant_lifecycle.resolve'
    ];
    it('binds only exact Auth SPIFFE to the three exact target tuples without wildcard', () => {
        const profile = JSON.parse(readFileSync(join(__dirname, '../../../../../scripts/local/runtime-config/permission-auth-login-workload-policies.json'), 'utf8'));
        expect(profile).toHaveLength(3);
        expect(profile.map((entry: any) => entry.permissionCodes[0]).sort()).toEqual(codes);
        for (const entry of profile) {
            expect(entry.originalWorkloadSpiffeId).toBe('spiffe://local.oes.internal/ns/oes/sa/auth-service');
            expect(entry.scopeLevel).toBe('SYSTEM');
            expect(entry.targetAudience).toMatch(/^urn:oes:service:(hr|identity|tenant-org)-service$/);
            expect(JSON.stringify(entry)).not.toContain('*');
            expect(entry).not.toHaveProperty('tenantIds');
            expect(entry).not.toHaveProperty('role');
            expect(entry).not.toHaveProperty('grant');
        }
    });
});
