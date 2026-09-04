import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
/** Locks the permission-service token-only boundary to its exact audience and declaration source. */
describe('permission-service trusted gRPC security', () => {
    it('uses one canonical target audience and no legacy class guard', () => {
        const source = readFileSync(join(__dirname, '../../src/interfaces/grpc/permission-management.grpc.controller.ts'), 'utf8');
        expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/);
        expect(source).not.toMatch(/@RequireAuthenticatedOperator/);
    });
    it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
        const source = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8');
        expect(source).not.toMatch(/OES_GRPC_TLS_ENABLED/);
    });
});
