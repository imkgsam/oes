import { describe, expect, it, vi } from 'vitest'

import {
  annotateCrmSearchTabAfterActivation,
  renderCrmOfficialSitePanelAfterActivation,
  type BackgroundCrmOfficialSitePanelOutcome,
  type BackgroundCrmSearchAnnotationOutcome
} from './background-tab-activation'

describe('background CRM tab activation handling', () => {
  it('retries activation annotation when the first tab snapshot is not ready', async () => {
    const skipped: BackgroundCrmSearchAnnotationOutcome = { annotatedCount: 0, skipped: true }
    const annotated: BackgroundCrmSearchAnnotationOutcome = { annotatedCount: 2, skipped: false }
    const getTab = vi.fn()
      .mockResolvedValueOnce({ id: 7, status: 'loading' })
      .mockResolvedValueOnce({
        id: 7,
        status: 'complete',
        url: 'https://www.google.com/search?q=console+sink'
      })
    const annotateTab = vi.fn()
      .mockResolvedValueOnce(skipped)
      .mockResolvedValueOnce(annotated)
    const sleep = vi.fn().mockResolvedValue(undefined)

    await expect(
      annotateCrmSearchTabAfterActivation(7, {
        annotateTab,
        getTab,
        retryDelaysMs: [0, 300],
        sleep
      })
    ).resolves.toBe(annotated)

    expect(getTab).toHaveBeenCalledTimes(2)
    expect(annotateTab).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(300)
  })

  it('retries official-site panel rendering when the activated tab snapshot is not ready', async () => {
    const skipped: BackgroundCrmOfficialSitePanelOutcome = { rendered: false, skipped: true }
    const rendered: BackgroundCrmOfficialSitePanelOutcome = { rendered: true, skipped: false }
    const getTab = vi.fn()
      .mockResolvedValueOnce({ id: 8, status: 'loading' })
      .mockResolvedValueOnce({
        id: 8,
        status: 'complete',
        url: 'https://swissmadison.com/'
      })
    const renderTab = vi.fn()
      .mockResolvedValueOnce(skipped)
      .mockResolvedValueOnce(rendered)
    const sleep = vi.fn().mockResolvedValue(undefined)

    await expect(
      renderCrmOfficialSitePanelAfterActivation(8, {
        getTab,
        renderTab,
        retryDelaysMs: [0, 300],
        sleep
      })
    ).resolves.toBe(rendered)

    expect(getTab).toHaveBeenCalledTimes(2)
    expect(renderTab).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(300)
  })

  it('skips search annotation when the activated tab disappears before Chrome returns it', async () => {
    const getTab = vi.fn().mockRejectedValue(new Error('No tab with id: 1572973049'))
    const annotateTab = vi.fn()

    await expect(
      annotateCrmSearchTabAfterActivation(1572973049, {
        annotateTab,
        getTab,
        retryDelaysMs: [0],
        sleep: vi.fn()
      })
    ).resolves.toEqual({ annotatedCount: 0, skipped: true })

    expect(annotateTab).not.toHaveBeenCalled()
  })

  it('skips official-site rendering when the activated tab disappears before Chrome returns it', async () => {
    const getTab = vi.fn().mockRejectedValue(new Error('No tab with id: 1572973049'))
    const renderTab = vi.fn()

    await expect(
      renderCrmOfficialSitePanelAfterActivation(1572973049, {
        getTab,
        renderTab,
        retryDelaysMs: [0],
        sleep: vi.fn()
      })
    ).resolves.toEqual({ rendered: false, skipped: true })

    expect(renderTab).not.toHaveBeenCalled()
  })
})
