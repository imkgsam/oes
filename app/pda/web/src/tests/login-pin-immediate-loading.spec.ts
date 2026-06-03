import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const loginView = readFileSync(resolve(__dirname, '../views/login-view.vue'), 'utf8');

describe('pda terminal PIN immediate loading feedback', () => {
  it('starts submitting inside the keypad digit handler when the sixth PIN digit is entered', () => {
    const appendPinDigit = loginView.match(/function appendPinDigit\(digit: string\): void \{[\s\S]*?\n\}/m)?.[0] ?? '';

    expect(appendPinDigit).toContain('const nextPin = `${pin.value}${digit}`;');
    expect(appendPinDigit).toContain('if (isCompleteTerminalPin(nextPin))');
    expect(appendPinDigit).toContain('submitting.value = true;');
    expect(appendPinDigit.indexOf('submitting.value = true;')).toBeLessThan(
      appendPinDigit.indexOf('handleEmployeeCodePinSubmit()'),
    );
  });

  it('renders a clear lock-screen loading state while the PIN login is submitting', () => {
    expect(loginView).toContain('class="login-pin-unlock__loading"');
    expect(loginView).toContain('role="status"');
    expect(loginView).toContain('验证中');
  });
});
