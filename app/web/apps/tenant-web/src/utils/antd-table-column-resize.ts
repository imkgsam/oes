const RESIZER_ATTRIBUTE = 'data-tenant-table-column-resizer';
const RESIZABLE_HEADER_CLASS = 'tenant-table-resizable-header';
const RESIZER_CLASS = 'tenant-table-column-resizer';
const RESIZING_BODY_CLASS = 'tenant-table-column-resize--dragging';
const MIN_COLUMN_WIDTH = 72;

let observer: MutationObserver | null = null;
let scanFrame: number | null = null;
let activeStopResize: null | (() => void) = null;
const tableColumnWidthState = new WeakMap<HTMLElement, Map<number, number>>();

interface ResizeTableState {
  initialWidth: number;
  table: HTMLTableElement;
}

interface ResizeSession {
  columnIndex: number;
  columnWidths: Map<number, number>;
  initialTableWidths: WeakMap<HTMLTableElement, number>;
  scope: HTMLElement;
  startWidth: number;
  startX: number;
  tableRootIndex: number;
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
      applyStoredColumnWidths(tableRoot);
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
  const startWidth = resolveColumnStartWidth(headerCell, tableScope, columnIndex);
  const columnWidths = tableColumnWidthState.get(tableScope) ?? new Map<number, number>();
  const session: ResizeSession = {
    columnIndex,
    columnWidths,
    initialTableWidths: new WeakMap<HTMLTableElement, number>(),
    scope: tableScope,
    startWidth,
    startX: event.clientX,
    tableRootIndex: getTableScopeIndex(tableScope),
  };
  tableColumnWidthState.set(tableScope, columnWidths);

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

// resolveColumnStartWidth prefers explicit Ant Table widths before falling back to live layout.
function resolveColumnStartWidth(
  headerCell: HTMLTableCellElement,
  tableScope: HTMLElement,
  columnIndex: number,
): number {
  const firstTableColumn = tableScope.querySelectorAll<HTMLTableColElement>(
    'table colgroup col',
  )[columnIndex];
  const explicitWidth =
    parseCssPixelWidth(headerCell.style.width) ??
    parseCssPixelWidth(firstTableColumn?.style.width ?? '') ??
    parseCssPixelWidth(firstTableColumn?.getAttribute('width') ?? '');
  const layoutWidth = Math.round(headerCell.getBoundingClientRect().width);

  return Math.max(MIN_COLUMN_WIDTH, explicitWidth ?? layoutWidth);
}

// parseCssPixelWidth reads inline pixel widths that remain available even when layout is not.
function parseCssPixelWidth(value: string): number | undefined {
  const parsedWidth = Number.parseFloat(value);

  if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
    return undefined;
  }

  return Math.round(parsedWidth);
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

// getTableScopeIndex records a stable fallback position when Ant Table replaces its root node.
function getTableScopeIndex(tableScope: HTMLElement): number {
  return [...document.querySelectorAll<HTMLElement>('.ant-table')].indexOf(tableScope);
}

// resolveCurrentTableScope keeps an active drag attached when the table root is redrawn mid-drag.
function resolveCurrentTableScope(session: ResizeSession): HTMLElement {
  if (session.scope.isConnected) {
    return session.scope;
  }

  return (
    [...document.querySelectorAll<HTMLElement>('.ant-table')][session.tableRootIndex] ??
    session.scope
  );
}

// applyColumnWidth updates matching colgroup entries and table widths for the active drag session.
function applyColumnWidth(session: ResizeSession, nextWidth: number) {
  const scope = resolveCurrentTableScope(session);
  session.scope = scope;
  session.columnWidths.set(session.columnIndex, nextWidth);
  tableColumnWidthState.set(scope, session.columnWidths);
  applyColumnWidthToScope(
    scope,
    session.columnIndex,
    nextWidth,
    session.startWidth,
    session.initialTableWidths,
  );
}

// applyStoredColumnWidths replays remembered DOM-level widths after Ant Table redraws internal tables.
function applyStoredColumnWidths(tableScope: HTMLElement) {
  const columnWidths = tableColumnWidthState.get(tableScope);

  if (!columnWidths) {
    return;
  }

  columnWidths.forEach((nextWidth, columnIndex) => {
    applyColumnWidthToScope(tableScope, columnIndex, nextWidth, nextWidth, new WeakMap());
  });
}

// applyColumnWidthToScope writes one column width against the current Ant Table DOM fragments.
function applyColumnWidthToScope(
  scope: HTMLElement,
  columnIndex: number,
  nextWidth: number,
  startWidth: number,
  initialTableWidths: WeakMap<HTMLTableElement, number>,
) {
  const width = `${nextWidth}px`;
  const delta = nextWidth - startWidth;
  const minTableWidthOffset = MIN_COLUMN_WIDTH - startWidth;

  for (const tableState of collectResizeTables(scope)) {
    const cols =
      tableState.table.querySelectorAll<HTMLTableColElement>('colgroup col');
    const column = cols[columnIndex];

    if (column) {
      column.style.width = width;
      column.style.minWidth = width;
    }

    if (tableState.initialWidth > 0) {
      const initialWidth =
        initialTableWidths.get(tableState.table) ?? tableState.initialWidth;
      initialTableWidths.set(tableState.table, initialWidth);
      const nextTableWidth = Math.max(
        initialWidth + minTableWidthOffset,
        initialWidth + delta,
      );
      tableState.table.style.width = `${Math.round(nextTableWidth)}px`;
      tableState.table.style.minWidth = `${Math.round(nextTableWidth)}px`;
    }
  }

  scope
    .querySelectorAll<HTMLElement>(
      [
        `thead tr > th:nth-child(${columnIndex + 1})`,
        `tbody tr > td:nth-child(${columnIndex + 1})`,
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
