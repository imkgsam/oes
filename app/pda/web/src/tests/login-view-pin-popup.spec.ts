import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const loginView = readFileSync(resolve(__dirname, '../views/login-view.vue'), 'utf8');

function pinUnlockTemplate(): string {
  const match = loginView.match(/<div v-if="pinPopupVisible"[\s\S]*?<\/section>/m);
  return match?.[0] ?? '';
}

describe('login view terminal PIN popup', () => {
  it('uses a lock-screen style PIN entry instead of Vant input and soft keyboard', () => {
    const pinUnlock = pinUnlockTemplate();

    expect(pinUnlock).toContain('class="login-pin-unlock"');
    expect(pinUnlock).toContain('class="login-pin-unlock__dots"');
    expect(pinUnlock).toContain('class="login-pin-unlock__keypad"');
    expect(pinUnlock).toContain('appendPinDigit');
    expect(pinUnlock).toContain('deletePinDigit');
    expect(pinUnlock).not.toContain('重新扫描');
    expect(pinUnlock).not.toContain('重扫');
    expect(pinUnlock).not.toContain('<van-password-input');
    expect(pinUnlock).not.toContain('<van-number-keyboard');
    expect(pinUnlock).not.toContain('normalizedEmployeeCode');
  });

  it('can return from PIN entry to employee-code input without a rescan button', () => {
    const pinUnlock = pinUnlockTemplate();

    expect(pinUnlock).toContain('class="login-pin-unlock__back"');
    expect(pinUnlock).toContain('@pointerdown.prevent="resetEmployeeCodeLogin"');
    expect(pinUnlock).toContain('返回');
    expect(pinUnlock).not.toContain('重新扫描');
    expect(pinUnlock).not.toContain('重扫');
  });

  it('preflights employee code before opening the PIN popup', () => {
    expect(loginView).toContain('preflightPdaEmployeeCodePin');
    expect(loginView).toContain('await preflightEmployeeCodeLogin(employeeCode)');
    expect(loginView.indexOf('await preflightEmployeeCodeLogin(employeeCode)')).toBeLessThan(
      loginView.indexOf('openPinPopup()'),
    );
  });
});
