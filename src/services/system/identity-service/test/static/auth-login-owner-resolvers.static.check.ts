import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
describe('Identity Auth-only login owner resolvers', () => {
    it('freezes the three additive methods and one exact INTERNAL Code', () => {
        const proto = readFileSync(join(__dirname, '../../../../../common/src/contracts/identity_service/identity_query.proto'), 'utf8');
        const controller = readFileSync(join(__dirname, '../../src/interfaces/grpc/identity-query.grpc.controller.ts'), 'utf8');
        for (const method of [
            'ListAuthLoginAccountCandidates',
            'ResolveAuthLoginAccount',
            'ResolveAuthEmployeeLoginAccount'
        ]) {
            expect(proto).toContain(`rpc ${method}(`);
        }
        expect(controller.match(/AuthorizeInternalCall\(\{ all: \['identity\.internal\.auth_login_account\.resolve'\] \}\)/g)).toHaveLength(3);
        expect(controller).not.toContain("applyIdentityQueryDeclaration('resolveAuth");
    });
});
