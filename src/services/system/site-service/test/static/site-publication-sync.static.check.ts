import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
describe('site-service publication and sync Unit', () => {
    it('Content Category migration / converts historical runtime views and sync resources without rewriting opaque IDs', () => {
        const migration = readFileSync(join(__dirname, '../../prisma/migrations/202607170001_site_content_categories/migration.sql'), 'utf8');
        expect(migration).toMatch(/UPDATE\s+"SitePublicView"[\s\S]*?"resourceType"\s*=\s*'article-category'/);
        expect(migration).toMatch(/UPDATE\s+"SitePublicView"[\s\S]*?'\{category_ids\}'/);
        expect(migration).toMatch(/FROM\s+"SiteContentCategory"/);
        expect(migration).toMatch(/UPDATE\s+"SiteSyncResource"[\s\S]*?"resourceType"\s*=\s*'article-category'/);
        expect(migration).toContain('stable opaque IDs');
        expect(migration).toContain('SiteAuditEnvelope');
    });
});
