import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const loginView = readFileSync(resolve(__dirname, '../views/login-view.vue'), 'utf8');
const css = readFileSync(resolve(__dirname, '../styles/pda-theme.css'), 'utf8');

function pinKeyRule(): string {
  const match = css.match(/\.login-pin-unlock__key\s*\{[\s\S]*?\}/m);
  return match?.[0] ?? '';
}

describe('pda pin input performance', () => {
  it('uses immediate pointer handlers rather than delayed click handlers for PIN keys', () => {
    expect(loginView).toContain('@pointerdown.prevent="appendPinDigit(digit)"');
    expect(loginView).toContain('@pointerdown.prevent="appendPinDigit(\'0\')"');
    expect(loginView).toContain('@pointerdown.prevent="deletePinDigit"');
    expect(loginView).not.toContain('@click="appendPinDigit');
    expect(loginView).not.toContain('@click="deletePinDigit"');
  });

  it('keeps PIN key rendering cheap for Android 9 WebView 66', () => {
    const rule = pinKeyRule();

    expect(rule).toContain('touch-action: manipulation');
    expect(rule).not.toContain('box-shadow');
    expect(rule).not.toContain('transition');
  });
});
