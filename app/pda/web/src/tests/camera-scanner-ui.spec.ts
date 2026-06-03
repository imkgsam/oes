import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const enrollmentView = readFileSync(resolve(__dirname, '../views/enrollment-view.vue'), 'utf8');
const scanDiagnosticCard = readFileSync(resolve(__dirname, '../components/scan-diagnostic-card.vue'), 'utf8');

describe('camera scanner UI entry points', () => {
  it('places enrollment camera scan behind the input field icon action', () => {
    expect(enrollmentView).toContain('aria-label="使用相机扫描 enrollment code"');
    expect(enrollmentView).toContain('@click.stop.prevent="openEnrollmentCameraScanner"');
    expect(enrollmentView).toContain('<template #right-icon>');
  });

  it('uses a normal workbench diagnostic button for camera scan checks', () => {
    expect(scanDiagnosticCard).toContain('相机扫码');
    expect(scanDiagnosticCard).toContain('@click="openDiagnosticCameraScanner"');
    expect(scanDiagnosticCard).toContain(':loading="cameraScanning"');
  });
});
