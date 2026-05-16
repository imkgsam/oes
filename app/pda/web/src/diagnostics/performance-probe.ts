import { nextTick } from 'vue';

const LOG_PREFIX = '[OES_PDA_PERF]';
const actionMarks = new Map<string, number>();

declare global {
  interface Window {
    __OES_PDA_DEBUG__?: boolean;
  }
}

/** Records the earliest user-input timestamp for a PDA UI action. */
export function markActionStart(action: string): void {
  if (!isPerformanceProbeEnabled()) {
    return;
  }
  actionMarks.set(action, performance.now());
  log(action, 'touchstart');
}

/** Logs a named checkpoint for a PDA UI action without changing its behavior. */
export function markActionStep(action: string, step: string): void {
  if (!isPerformanceProbeEnabled()) {
    return;
  }
  if (!actionMarks.has(action)) {
    actionMarks.set(action, performance.now());
  }
  log(action, step);
}

/** Logs when Vue has patched the DOM and the browser has had one frame to paint it. */
export async function markActionPainted(action: string, step: string): Promise<void> {
  if (!isPerformanceProbeEnabled()) {
    return;
  }
  await nextTick();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  log(action, step);
  actionMarks.delete(action);
}

/** Keeps performance probes out of normal production runtime unless Android Shell enables debug mode. */
function isPerformanceProbeEnabled(): boolean {
  return import.meta.env.DEV || window.__OES_PDA_DEBUG__ === true;
}

/** Emits compact timing logs that Android WebView forwards to logcat in debug builds. */
function log(action: string, step: string): void {
  const startedAt = actionMarks.get(action) ?? performance.now();
  const elapsedMs = Math.round((performance.now() - startedAt) * 10) / 10;
  console.info(`${LOG_PREFIX} action=${action} step=${step} elapsedMs=${elapsedMs}`);
}
