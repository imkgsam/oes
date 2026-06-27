import { describe, expect, it, vi } from 'vitest'

import { createDeferredTabTaskScheduler } from './background-tab-scheduler'

describe('background tab task scheduler', () => {
  it('defers tab lifecycle work and keeps only the latest task for one tab', () => {
    vi.useFakeTimers()
    const runTask = vi.fn()
    const scheduler = createDeferredTabTaskScheduler({
      delayMs: 1_200,
      runTask
    })

    scheduler.schedule({ id: 7, url: 'https://slow.example/loading' }, 'official-site-panel')
    scheduler.schedule({ id: 7, url: 'https://slow.example/complete' }, 'official-site-panel')
    vi.advanceTimersByTime(1_199)

    expect(runTask).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)

    expect(runTask).toHaveBeenCalledTimes(1)
    expect(runTask).toHaveBeenCalledWith({ id: 7, url: 'https://slow.example/complete' })
    vi.useRealTimers()
  })
})
