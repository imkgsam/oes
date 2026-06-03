const RESIZER_ATTRIBUTE = 'data-tenant-table-column-resizer';
const RESIZABLE_HEADER_CLASS = 'tenant-table-resizable-header';
const RESIZER_CLASS = 'tenant-table-column-resizer';
const RESIZING_BODY_CLASS = 'tenant-table-column-resize--dragging';
const MIN_COLUMN_WIDTH = 72;

let observer: MutationObserver | null = null;
let scanFrame: number | null = null;
let activeStopResize: null | (() => void) = null;

interface ResizeTableState {
  initialWidth: number;
  table: HTMLTableElement;
}

interface ResizeSession {
  columnIndex: number;
  scope: HTMLElement;
  startWidth: number;
  startX: number;
  tables: ResizeTableState[];
}

// installAntdTableColumnResize enables lightweight column dragging for every rendered Ant Design Vue table.
export function installAntdTableColumnResize() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    observer
  ) {
    return;
  }

  document.addEventListener('mousedown', handleResizeMouseDown);
  scheduleTableScan();

  observer = new MutationObserver(scheduleTableScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// scheduleTableScan batches table header enhancement after Vue and Ant Design finish rendering DOM updates.
function scheduleTableScan() {
  if (scanFrame !== null) {
    window.cancelAnimationFrame(scanFrame);
  }

  scanFrame = window.requestAnimationFrame(() => {
    scanFrame = null;
    enhanceRenderedTables();
  });
}

// enhanceRenderedTables adds one drag handle to each eligible Ant Design table header cell.
function enhanceRenderedTables() {
  document
    .querySelectorAll<HTMLElement>('.ant-table')
    .forEach((tableRoot) => {
      tableRoot
        .querySelectorAll<HTMLTableCellElement>(
          '.ant-table-thead > tr > th.ant-table-cell',
        )
        .forEach((headerCell) => enhanceHeaderCell(headerCell));
    });
}

// enhanceHeaderCell skips utility columns and headers that already own a local resize implementation.
function enhanceHeaderCell(headerCell: HTMLTableCellElement) {
  if (
    headerCell.hasAttribute(RESIZER_ATTRIBUTE) ||
    headerCell.colSpan > 1 ||
    headerCell.classList.contains('ant-table-cell-scrollbar') ||
    headerCell.classList.contains('ant-table-selection-column') ||
    headerCell.classList.contains('ant-table-row-expand-icon-cell') ||
    headerCell.querySelector('[class*="column-resizer"]')
  ) {
    return;
  }

  headerCell.setAttribute(RESIZER_ATTRIBUTE, 'true');
  headerCell.classList.add(RESIZABLE_HEADER_CLASS);

  const resizer = document.createElement('span');
  resizer.setAttribute(RESIZER_ATTRIBUTE, 'true');
  resizer.setAttribute('aria-label', '调整列宽');
  resizer.setAttribute('role', 'separator');
  resizer.className = RESIZER_CLASS;
  headerCell.append(resizer);
}

// handleResizeMouseDown starts resizing only from the global resize handle.
function handleResizeMouseDown(event: MouseEvent) {
  const target = event.target;

  if (
    !(target instanceof HTMLElement) ||
    !target.classList.contains(RESIZER_CLASS)
  ) {
    return;
  }

  const headerCell = target.closest<HTMLTableCellElement>('th.ant-table-cell');
  const tableScope = target.closest<HTMLElement>('.ant-table');

  if (!headerCell || !tableScope) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  startColumnResize(event, headerCell, tableScope);
}

// startColumnResize captures table dimensions so dragging changes one column without collapsing neighbors.
function startColumnResize(
  event: MouseEvent,
  headerCell: HTMLTableCellElement,
  tableScope: HTMLElement,
) {
  activeStopResize?.();

  const columnIndex = headerCell.cellIndex;
  const startWidth = Math.max(
    MIN_COLUMN_WIDTH,
    Math.round(headerCell.getBoundingClientRect().width),
  );
  const tables = collectResizeTables(tableScope);
  const session: ResizeSession = {
    columnIndex,
    scope: tableScope,
    startWidth,
    startX: event.clientX,
    tables,
  };

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const nextWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.round(session.startWidth + moveEvent.clientX - session.startX),
    );
    applyColumnWidth(session, nextWidth);
  };
  const handleMouseUp = () => {
    stopColumnResize(handleMouseMove, handleMouseUp);
  };

  document.body.classList.add(RESIZING_BODY_CLASS);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
  activeStopResize = () => stopColumnResize(handleMouseMove, handleMouseUp);
}

// collectResizeTables records all table fragments that belong to one Ant Design table instance.
function collectResizeTables(tableScope: HTMLElement): ResizeTableState[] {
  return [...tableScope.querySelectorAll<HTMLTableElement>('table')].map(
    (table) => ({
      initialWidth:
        Number.parseFloat(table.style.width || '') ||
        Math.round(table.getBoundingClientRect().width),
      table,
    }),
  );
}

// applyColumnWidth updates matching colgroup entries and table widths for the active drag session.
function applyColumnWidth(session: ResizeSession, nextWidth: number) {
  const width = `${nextWidth}px`;
  const delta = nextWidth - session.startWidth;
  const minTableWidthOffset = MIN_COLUMN_WIDTH - session.startWidth;

  for (const tableState of session.tables) {
    const cols =
      tableState.table.querySelectorAll<HTMLTableColElement>('colgroup col');
    const column = cols[session.columnIndex];

    if (column) {
      column.style.width = width;
      column.style.minWidth = width;
    }

    if (tableState.initialWidth > 0) {
      const nextTableWidth = Math.max(
        tableState.initialWidth + minTableWidthOffset,
        tableState.initialWidth + delta,
      );
      tableState.table.style.width = `${Math.round(nextTableWidth)}px`;
      tableState.table.style.minWidth = `${Math.round(nextTableWidth)}px`;
    }
  }

  session.scope
    .querySelectorAll<HTMLElement>(
      [
        `thead tr > th:nth-child(${session.columnIndex + 1})`,
        `tbody tr > td:nth-child(${session.columnIndex + 1})`,
      ].join(', '),
    )
    .forEach((cell) => {
      cell.style.width = width;
      cell.style.minWidth = width;
    });
}

// stopColumnResize releases document listeners and returns the page cursor to normal.
function stopColumnResize(
  handleMouseMove: (event: MouseEvent) => void,
  handleMouseUp: () => void,
) {
  document.body.classList.remove(RESIZING_BODY_CLASS);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  activeStopResize = null;
}
