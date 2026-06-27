import { afterEach, describe, expect, it, vi } from 'vitest'

import { installCrmSearchAutoRequestInCurrentDocument } from './crm-search-page-observer'

describe('CRM search page observer', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests CRM annotation after Google results render asynchronously', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search"></div>
          </body>
        </html>
      `,
      'text/html'
    )
    const pageGlobal = {
      MutationObserver,
      chrome: { runtime: { sendMessage } },
      document,
      location: {
        href: 'https://www.google.com/search?q=console+sink',
        hostname: 'www.google.com',
        pathname: '/search',
        protocol: 'https:'
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    }
    const serializedInstaller = new Function(
      'pageGlobal',
      `
        const globalThis = pageGlobal
        return (${installCrmSearchAutoRequestInCurrentDocument.toString()})()
      `
    )

    expect(serializedInstaller(pageGlobal)).toEqual({ installed: true, skipped: false })
    document.querySelector('#search')?.insertAdjacentHTML(
      'beforeend',
      '<div class="g"><a href="https://console.example"><h3>Console Sink</h3></a></div>'
    )

    await new Promise((resolve) => setTimeout(resolve, 380))

    expect(sendMessage).toHaveBeenCalledWith({ type: 'oes.crm.annotateSearchPage' })
  })

  it('does not schedule another annotation request when the observer is already installed', async () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const document = new DOMParser().parseFromString(
      '<html><body><div id="search"><a href="https://console.example"><h3>Console Sink</h3></a></div></body></html>',
      'text/html'
    )
    const pageGlobal = {
      MutationObserver,
      chrome: { runtime: { sendMessage } },
      document,
      location: {
        href: 'https://www.google.com/search?q=console+sink',
        hostname: 'www.google.com',
        pathname: '/search',
        protocol: 'https:'
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    }
    const serializedInstaller = new Function(
      'pageGlobal',
      `
        const globalThis = pageGlobal
        return (${installCrmSearchAutoRequestInCurrentDocument.toString()})()
      `
    )

    expect(serializedInstaller(pageGlobal)).toEqual({ installed: true, skipped: false })
    await vi.advanceTimersByTimeAsync(300)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    expect(serializedInstaller(pageGlobal)).toEqual({ installed: true, skipped: false })
    await vi.advanceTimersByTimeAsync(300)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  it('requests another annotation promptly when Show more images appends image cards', async () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const document = new DOMParser().parseFromString(
      `
        <html>
          <body>
            <div id="search">
              <h2>Images</h2>
              <div class="image-grid">
                <a href="https://signaturehardware.example/30-cierra-console-sink">
                  <img alt="30 inch Cierra console sink" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                  <div>30&quot; Cierra Console Sink</div>
                  <div>Signature Hardware</div>
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )
    const pageGlobal = {
      MutationObserver,
      chrome: { runtime: { sendMessage } },
      document,
      location: {
        href: 'https://www.google.com/search?q=console+sink',
        hostname: 'www.google.com',
        pathname: '/search',
        protocol: 'https:'
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    }
    const serializedInstaller = new Function(
      'pageGlobal',
      `
        const globalThis = pageGlobal
        return (${installCrmSearchAutoRequestInCurrentDocument.toString()})()
      `
    )

    serializedInstaller(pageGlobal)
    await vi.advanceTimersByTimeAsync(300)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    document.querySelector('.image-grid')?.insertAdjacentHTML(
      'beforeend',
      `
        <a href="https://rejuvenation.example/winslow-marble-vanity">
          <img alt="Winslow Marble Vanity" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
          <div>Winslow Marble Vanity</div>
          <div>Rejuvenation</div>
        </a>
      `
    )

    await vi.advanceTimersByTimeAsync(300)
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })

  it('rate limits repeated Google DOM mutations before asking the background worker again', async () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const document = new DOMParser().parseFromString(
      '<html><body><div id="search"></div></body></html>',
      'text/html'
    )
    const pageGlobal = {
      MutationObserver,
      chrome: { runtime: { sendMessage } },
      document,
      location: {
        href: 'https://www.google.com/search?q=console+sink',
        hostname: 'www.google.com',
        pathname: '/search',
        protocol: 'https:'
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    }
    const serializedInstaller = new Function(
      'pageGlobal',
      `
        const globalThis = pageGlobal
        return (${installCrmSearchAutoRequestInCurrentDocument.toString()})()
      `
    )

    serializedInstaller(pageGlobal)
    await vi.advanceTimersByTimeAsync(300)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    for (let index = 0; index < 6; index += 1) {
      document.querySelector('#search')?.insertAdjacentHTML(
        'beforeend',
        `<div class="g"><a href="https://console-${index}.example"><h3>Console ${index}</h3></a></div>`
      )
      await vi.advanceTimersByTimeAsync(500)
    }

    expect(sendMessage).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(6000)
    expect(sendMessage).toHaveBeenCalledTimes(2)
  })
})
