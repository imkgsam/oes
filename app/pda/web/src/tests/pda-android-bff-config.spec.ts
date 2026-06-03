import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const gradleFile = readFileSync(resolve(__dirname, '../../../android/app/build.gradle.kts'), 'utf8');

describe('pda android bff config', () => {
  it('packages the current field backend as the default BFF address', () => {
    expect(gradleFile).toContain('"http://192.168.2.33:9101/api/v1"');
  });
});
