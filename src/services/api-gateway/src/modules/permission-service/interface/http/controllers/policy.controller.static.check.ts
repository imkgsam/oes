import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { expect } from '../../../../../../../../common/src/testing/static-check-assertions.mjs';

const source = readFileSync(new URL('./policy.controller.ts', import.meta.url), 'utf8');

describe('PolicyController source contract', () => {
  it('keeps the policy governance controller GET-only', () => {
    expect(source).toContain("@Get('policy')");
    expect(source).toContain("@Get('policy/:id')");
    expect(source).toContain("@Get('permission/:permissionCode/policies')");
    expect(source).not.toMatch(/\b(Post|Patch|Put|Delete|Body)\b/);
  });
});
