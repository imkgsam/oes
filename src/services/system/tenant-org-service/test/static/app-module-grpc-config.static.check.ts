import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
/** Locks TenantOrg's production foundation calls to dedicated mTLS client providers. */
describe('tenant-org AppModule gRPC config', () => {
    it('contains no generic foundation registration or plaintext fallback', () => {
        const appSource = readFileSync(join(__dirname, '../../src/app.module.ts'), 'utf8');
        const managementSource = readFileSync(join(__dirname, '../../src/modules/tenant-org-management/tenant-org-management.module.ts'), 'utf8');
        const querySource = readFileSync(join(__dirname, '../../src/modules/tenant-org-query/tenant-org-query.module.ts'), 'utf8');
        const clientsSource = readFileSync(join(__dirname, '../../src/infrastructure/adapters/foundation-trusted-grpc.clients.ts'), 'utf8');
        expect(`${appSource}\n${managementSource}\n${querySource}`).not.toMatch(/GrpcTransportModule\.for(?:Root|Feature)/);
        expect(clientsSource).toMatch(/credentials:\s*createGrpcClientCredentials\(\)/);
    });
});
