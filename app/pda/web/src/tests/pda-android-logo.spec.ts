import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifestPath = resolve(__dirname, '../../../android/app/src/main/AndroidManifest.xml');
const logoPath = resolve(__dirname, '../../../android/app/src/main/res/drawable/oes_pda_logo.xml');

describe('pda android app logo', () => {
  it('configures a launcher logo resource for the Android shell', () => {
    const manifest = readFileSync(manifestPath, 'utf8');

    expect(manifest).toContain('android:icon="@drawable/oes_pda_logo"');
    expect(manifest).toContain('android:roundIcon="@drawable/oes_pda_logo"');
    expect(existsSync(logoPath)).toBe(true);
  });
});
