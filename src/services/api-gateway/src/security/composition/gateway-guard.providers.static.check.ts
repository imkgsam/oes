import { describe, it, test } from 'node:test'
import { expect } from '../../../../../common/src/testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
import { readFileSync } from 'node:fs';
/** Gateway guard composition tests keep production and acceptance provider order on one seam. */
describe('createGatewayGuardProviders', () => {
    it('keeps AppModule wired through the shared guard factory seam exactly once', () => {
        const source = readFileSync(new URL('../../app.module.ts', import.meta.url), 'utf8');
        expect(source.match(/\.\.\.createGatewayGuardProviders\(\),/g)).toHaveLength(1);
    });
});
