import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const loginView = readFileSync(resolve(__dirname, '../views/login-view.vue'), 'utf8');

describe('pda login view simplified layout', () => {
  it('keeps the default login screen focused on employee code entry', () => {
    expect(loginView).toContain('class="login-view__logo"');
    expect(loginView).toContain('<h1>PDA 登录</h1>');
    expect(loginView).toContain('placeholder="扫码或输入工号"');
    expect(loginView).toContain('aria-label="使用相机扫描员工码"');
    expect(loginView).toContain('@click.stop.prevent="openEmployeeCodeCameraScanner"');
    expect(loginView).not.toContain('PDA 租户由设备绑定决定');
    expect(loginView).not.toContain('重新扫描/更换员工码');
  });

  it('uses strict employee barcode parsing before opening PIN from scanner input', () => {
    expect(loginView).toContain('parseEmployeeCodeScanInput(event.payload.scanValue)');
    expect(loginView).not.toContain('const employeeCode = normalizeEmployeeCodeInput(event.payload.scanValue)');
  });
});
