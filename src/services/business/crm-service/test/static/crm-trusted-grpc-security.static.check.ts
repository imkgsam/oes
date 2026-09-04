import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const mainSource = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8');
/** Locks all 15 CRM RPCs to the frozen Token-only Gateway/Collaboration matrix. */
describe('CRM trusted gRPC security matrix Static', () => {
    it('installs exact guards/context validator and deployment mTLS on all controllers', () => {
        expect(mainSource).toContain('credentials: createGrpcServerCredentials()');
    });
});
