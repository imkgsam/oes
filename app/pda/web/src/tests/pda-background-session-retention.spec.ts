import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mainTs = readFileSync(resolve(__dirname, '../main.ts'), 'utf8');
const mainActivityKt = readFileSync(
  resolve(__dirname, '../../../android/app/src/main/java/com/oes/pda/MainActivity.kt'),
  'utf8',
);

describe('pda background session retention', () => {
  it('does not clear the operator session when WebView is merely hidden or unloaded by Android backgrounding', () => {
    expect(mainTs).not.toContain("window.addEventListener('pagehide'");
    expect(mainTs).not.toContain('clearPdaSessionOnAppExit');
  });

  it('does not clear native token storage from Activity onDestroy because Back and Home can destroy background activities', () => {
    expect(mainActivityKt).not.toContain('override fun onDestroy()');
    expect(mainActivityKt).not.toContain('clearStoredSessionTokens');
  });
});
