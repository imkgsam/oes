import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
/** Locks Identity's HR reference adapter to its target-bound mTLS provider. */
describe('HrEmployeeReferenceGrpcAdaptor wiring', () => {
    it('injects the dedicated HR client instead of a generic client token', () => {
        const source = readFileSync(join(__dirname, '../../src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts'), 'utf8');
        expect(source).toMatch(/credentials:\s*createGrpcClientCredentials\(\)/);
    });
});
