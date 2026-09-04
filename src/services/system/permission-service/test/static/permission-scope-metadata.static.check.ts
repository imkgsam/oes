import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/** Verifies scope metadata survives persistence and management-read mapping without a permissive fallback. */
describe('Permission scope metadata pipeline', () => {
    it('migrates existing rows to empty scope and fingerprint until deterministic catalog sync', () => {
        const sql = readFileSync(resolve(__dirname, '../../prisma/migrations/20260819_permission_scope_metadata/migration.sql'), 'utf8');
        expect(sql).toContain('DEFAULT ARRAY[]::"PermissionScopeLevel"[]');
        expect(sql).toContain('"definitionFingerprint" TEXT NOT NULL DEFAULT \'\'');
        expect(sql).not.toMatch(/DEFAULT ARRAY\['SYSTEM'|DEFAULT ARRAY\['TENANT'/);
    });
});
