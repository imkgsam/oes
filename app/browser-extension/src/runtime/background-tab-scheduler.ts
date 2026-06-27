type DeferredTimerHandle = number | ReturnType<typeof globalThis.setTimeout>

export interface DeferredTabTaskSchedulerInput<TabSnapshot> {
  clearTimeout?: (handle: DeferredTimerHandle) => void
  delayMs?: number
  runTask: (tab: TabSnapshot) => void
  setTimeout?: (callback: () => void, delayMs: number) => DeferredTimerHandle
}

export interface DeferredTabTaskScheduler<TabSnapshot> {
  schedule(tab: TabSnapshot & { id?: number }, taskKey: string): void
}

const DEFAULT_DEFERRED_TAB_TASK_DELAY_MS = 1_200

// Defers and deduplicates extension tab lifecycle work so page-open rendering stays responsive.
export function createDeferredTabTaskScheduler<TabSnapshot>(
  input: DeferredTabTaskSchedulerInput<TabSnapshot>
): DeferredTabTaskScheduler<TabSnapshot> {
  const delayMs = input.delayMs ?? DEFAULT_DEFERRED_TAB_TASK_DELAY_MS
  const scheduleTimer = input.setTimeout ?? ((callback: () => void, timerDelayMs: number) =>
    globalThis.setTimeout(callback, timerDelayMs))
  const clearTimer = input.clearTimeout ?? ((handle: DeferredTimerHandle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>)
  })
  const timers = new Map<string, DeferredTimerHandle>()

  return {
    schedule(tab: TabSnapshot & { id?: number }, taskKey: string): void {
      if (!tab.id) {
        return
      }

      const key = `${taskKey}:${tab.id}`
      const pending = timers.get(key)
      if (pending) {
        clearTimer(pending)
      }

      const handle = scheduleTimer(() => {
        timers.delete(key)
        input.runTask(tab)
      }, delayMs)
      timers.set(key, handle)
    }
  }
}
