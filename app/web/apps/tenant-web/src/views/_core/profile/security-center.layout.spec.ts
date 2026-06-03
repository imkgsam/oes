import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(__dirname, 'security-center.vue'), 'utf8');

function extractButtonBlock(label: string) {
  return (
    [...source.matchAll(/<Button[\s\S]*?<\/Button>/g)]
      .map((match) => match[0])
      .find((block) => block.includes(label)) ?? ''
  );
}

function extractActionBlock(label: string) {
  return (
    [...source.matchAll(/<div class="security-form-actions">[\s\S]*?<\/div>/g)]
      .map((match) => match[0])
      .find((block) => block.includes(label)) ?? ''
  );
}

// Keeps high-frequency self-service form actions compact and aligned with the form edge.
describe('security center form action layout', () => {
  it('right-aligns password and terminal PIN submit actions without full-width buttons', () => {
    expect(source).toContain('class="security-form-actions"');
    expect(source).toContain('security-form-action-button');

    expect(extractButtonBlock('更新密码')).not.toMatch(/\bblock\b/);
    expect(extractButtonBlock('重设终端 PIN')).not.toMatch(/\bblock\b/);
    expect(extractButtonBlock('停用终端 PIN 登录')).not.toMatch(/\bblock\b/);
  });

  it('keeps terminal PIN actions in one compact right-aligned row', () => {
    const terminalPinActions = extractActionBlock('重设终端 PIN');

    expect(terminalPinActions).toContain('停用终端 PIN 登录');
    expect(terminalPinActions).not.toContain('<Space');
    expect(terminalPinActions).not.toMatch(/\bblock\b/);
    expect(source).not.toMatch(/\.security-form-actions\s*{[^}]*justify-content:\s*stretch;/);
    expect(source).not.toMatch(/\.security-form-action-button\s*{[^}]*flex:\s*1 1 100%;/);
  });
});
