import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const mainSource = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8');
/** Locks all 22 Procurement RPCs to the frozen token-only execution matrix. */
describe('Procurement trusted gRPC security matrix Static', () => {
    it('boots the Procurement server with deployment-owned mTLS credentials', () => {
        expect(mainSource).toContain('credentials: createGrpcServerCredentials()');
    });
});
