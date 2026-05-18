import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../styles/pda-theme.css'), 'utf8');

function ruleFor(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`, 'm'));
  return match?.groups?.body ?? '';
}

describe('pda layout css', () => {
  it('prevents diagnostic scan and photo content from widening the workbench viewport', () => {
    expect(ruleFor('html')).toContain('overflow-x: hidden');
    expect(ruleFor('body')).toContain('overflow-x: hidden');
    expect(ruleFor('.pda-app')).toContain('overflow-x: hidden');
    expect(ruleFor('.workbench-view')).toContain('overflow-x: hidden');
    expect(ruleFor('.pda-card h2')).toContain('word-break: break-all');
    expect(ruleFor('.scan-history span')).toContain('min-width: 0');
    expect(ruleFor('.scan-history span')).toContain('overflow-wrap: anywhere');
    expect(ruleFor('.scan-history span')).toContain('word-break: break-all');
  });
});
