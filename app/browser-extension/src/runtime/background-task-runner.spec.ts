import { describe, expect, it, vi } from 'vitest'

import { runBackgroundTask } from './background-task-runner'

describe('background task runner', () => {
  it('prevents fire-and-forget task rejections from becoming uncaught promises', async () => {
    const onError = vi.fn()

    runBackgroundTask(Promise.reject(new Error('No tab with id: 1572973042.')), { onError })
    await Promise.resolve()

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
})
