/* @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installAntdTableColumnResize } from './antd-table-column-resize';

function renderTable() {
  document.body.innerHTML = `
    <div class="ant-table">
      <table style="width: 300px;">
        <colgroup>
          <col style="width: 120px;" />
          <col style="width: 180px;" />
        </colgroup>
        <thead class="ant-table-thead">
          <tr>
            <th class="ant-table-cell" style="width: 120px;">Name</th>
            <th class="ant-table-cell" style="width: 180px;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width: 120px;">Alpha</td>
            <td style="width: 180px;">One</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

async function flushResizeScan() {
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
}

describe('installAntdTableColumnResize', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    renderTable();
    installAntdTableColumnResize();
  });

  it('continues resizing the current table DOM after Ant Table redraws during a drag', async () => {
    await flushResizeScan();

    const resizer = document.querySelector<HTMLElement>('.tenant-table-column-resizer');
    expect(resizer).not.toBeNull();

    resizer!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
    renderTable();
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }));

    const firstColumn = document.querySelector<HTMLTableColElement>('colgroup col:first-child');
    expect(firstColumn?.style.width).toBe('170px');

    document.dispatchEvent(new MouseEvent('mouseup'));
  });
});
