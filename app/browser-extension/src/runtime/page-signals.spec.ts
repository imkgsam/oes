import { describe, expect, it } from 'vitest'

import {
  collectCurrentPageSignals,
  collectPageSignalsFromDocument,
  collectSearchResultSignalsFromDocument
} from './page-signals'

describe('page signal collection', () => {
  it('collects bounded official-site signals without dumping the page body', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head>
            <title>Serrano Fixtures - About</title>
          </head>
          <body>
            <h1>Serrano Fixtures</h1>
            <a href="mailto:imports@serrano-fixtures.example">Email</a>
            <a href="tel:+1 (312) 847-1928">Phone</a>
            <a href="https://www.linkedin.com/company/serrano-fixtures">LinkedIn</a>
            <p>${'Export ceramic lighting. '.repeat(200)}</p>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectPageSignalsFromDocument(document, {
      href: 'https://www.serrano-fixtures.example/about',
      selectedText: ' Selected customer text '.repeat(80)
    })

    expect(signals).toMatchObject({
      domain: 'www.serrano-fixtures.example',
      pageKind: 'OFFICIAL_SITE',
      title: 'Serrano Fixtures - About',
      url: 'https://www.serrano-fixtures.example/about'
    })
    expect(signals.selectedText.length).toBeLessThanOrEqual(600)
    expect(signals.visibleEmails).toEqual(['imports@serrano-fixtures.example'])
    expect(signals.visiblePhones).toEqual(['+1 (312) 847-1928'])
    expect(signals.companyNameCandidates).toContain('Serrano Fixtures')
    expect(signals.socialLinks).toEqual(['https://www.linkedin.com/company/serrano-fixtures'])
    expect(JSON.stringify(signals)).not.toContain('Export ceramic lighting. Export ceramic lighting.')
  })

  it('queries only candidate social anchors instead of iterating every HTTP link on official sites', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>Large Catalog</title></head>
          <body>
            <h1>Large Catalog</h1>
            ${Array.from({ length: 1000 }, (_, index) => `
              <a href="https://catalog.example/products/${index}">Product ${index}</a>
            `).join('')}
            <a href="https://www.linkedin.com/company/large-catalog">LinkedIn</a>
            <a href="https://www.instagram.com/largecatalog">Instagram</a>
          </body>
        </html>
      `,
      'text/html'
    )
    const selectors: string[] = []
    const originalQuerySelectorAll = document.querySelectorAll.bind(document)
    document.querySelectorAll = ((selector: string) => {
      selectors.push(selector)
      return originalQuerySelectorAll(selector)
    }) as Document['querySelectorAll']

    const signals = collectPageSignalsFromDocument(document, {
      href: 'https://catalog.example'
    })

    expect(signals.socialLinks).toEqual([
      'https://www.linkedin.com/company/large-catalog',
      'https://www.instagram.com/largecatalog'
    ])
    expect(selectors).not.toContain('a[href^="http"]')
    expect(selectors.some((selector) => selector.includes('linkedin.com'))).toBe(true)
  })


  it('ignores fallback links that are not h3 search results or image cards', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>ceramic fixtures - Google Search</title></head>
          <body>
            ${Array.from({ length: 20 }, (_, index) => `
              <a href="https://candidate-${index}.example/about">Candidate ${index}</a>
            `).join('')}
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=ceramic+fixtures'
    })

    expect(signals.searchEngine).toBe('GOOGLE')
    expect(signals.query).toBe('ceramic fixtures')
    expect(signals.results).toEqual([])
  })

  it('extracts Google redirect result links that use relative /url targets', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>ceramic fixtures - Google Search</title></head>
          <body>
            <a href="/url?q=https%3A%2F%2Fserrano.example%2Fabout&sa=U">
              <h3>Serrano Fixtures</h3>
            </a>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=ceramic+fixtures'
    })

    expect(signals.results[0]).toMatchObject({
      domain: 'serrano.example',
      title: 'Serrano Fixtures',
      url: 'https://serrano.example/about'
    })
  })

  it('prioritizes real Google result title links instead of exhausting the cap on page chrome links', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
          <body>
            <nav>
              ${Array.from({ length: 12 }, (_, index) => `
                <a href="https://noise-${index}.example/help">Noise ${index}</a>
              `).join('')}
            </nav>
            <div id="search">
              <div class="g">
                <a href="/url?q=https%3A%2F%2Fowned-console.example%2Fabout&sa=U">
                  <h3>Owned Console Sink</h3>
                </a>
              </div>
              <div class="g">
                <a href="https://customer-console.example">
                  <h3>Customer Console Sink</h3>
                </a>
              </div>
              <div class="g">
                <a href="https://pool-console.example/products">
                  <h3>Pool Console Sink</h3>
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results.map((result) => result.domain)).toEqual([
      'owned-console.example',
      'customer-console.example',
      'pool-console.example'
    ])
  })

  it('collects Google image section source-page links in addition to capped web results', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
          <body>
            <div id="search">
              ${Array.from({ length: 10 }, (_, index) => `
                <div class="g">
                  <a href="https://web-${index}.example/about">
                    <h3>Web Result ${index}</h3>
                  </a>
                </div>
              `).join('')}
            </div>
            <section aria-label="Images">
              <a
                data-oes-image-result="true"
                href="/imgres?imgurl=https%3A%2F%2Fcdn.example%2Fowned.jpg&imgrefurl=https%3A%2F%2Fimage-owned.example%2Fcollections%2Fconsole-sinks"
              >
                <img alt="Owned image fixtures" src="https://cdn.example/owned.jpg" />
                <span>Owned Image Fixtures</span>
              </a>
              <a
                data-oes-image-result="true"
                href="/url?q=https%3A%2F%2Fimage-pool.example%2Fgallery&sa=i"
              >
                <img alt="Pool image fixtures" src="https://cdn.example/pool.jpg" />
                <span>Pool Image Fixtures</span>
              </a>
            </section>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results).toHaveLength(12)
    expect(signals.results.slice(0, 10).map((result) => result.domain)).toEqual(
      Array.from({ length: 10 }, (_, index) => `web-${index}.example`)
    )
    expect(signals.results.slice(10)).toEqual([
      expect.objectContaining({
        domain: 'image-owned.example',
        title: 'Owned Image Fixtures',
        url: 'https://image-owned.example/collections/console-sinks'
      }),
      expect.objectContaining({
        domain: 'image-pool.example',
        title: 'Pool Image Fixtures',
        url: 'https://image-pool.example/gallery'
      })
    ])
  })

  it('collects direct merchant links from the Google Images block on the search results page', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
          <body>
            <div id="search">
              <div class="g">
                <a href="https://ordinary.example/about">
                  <h3>Ordinary Web Result</h3>
                </a>
              </div>
              <h2>Images</h2>
              <div class="image-grid">
                <a href="https://signaturehardware.example/30-cierra-console-sink">
                  <img alt="30 inch Cierra console sink" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                  <div>30&quot; Cierra Console Sink with ...</div>
                  <div>Signature Hardware</div>
                </a>
                <a href="https://rejuvenation.example/winslow-marble-vanity">
                  <img alt="Winslow marble vanity" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
                  <div>Winslow Marble Vanity | Rejuv...</div>
                  <div>Rejuvenation</div>
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results).toEqual([
      expect.objectContaining({
        domain: 'ordinary.example',
        title: 'Ordinary Web Result',
        url: 'https://ordinary.example/about'
      }),
      expect.objectContaining({
        domain: 'signaturehardware.example',
        title: expect.stringContaining('Cierra Console Sink'),
        url: 'https://signaturehardware.example/30-cierra-console-sink'
      }),
      expect.objectContaining({
        domain: 'rejuvenation.example',
        title: expect.stringContaining('Winslow Marble Vanity'),
        url: 'https://rejuvenation.example/winslow-marble-vanity'
      })
    ])
  })

  it('collects Google Images overlay links whose image and title are sibling nodes', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
          <body>
            <div id="search">
              <div class="g">
                <a href="https://ordinary.example/about">
                  <h3>Ordinary Web Result</h3>
                </a>
              </div>
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://www.signaturehardware.com/30-in-cierra-console-sink-with-brass-stand/912178.html"
                ></a>
                <div class="oYLlHe">
                  <img alt="30&quot; Cierra Console Sink with Brass Stand - Polished Nickel" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </div>
                <div class="T3Fozb">
                  <div id="image-title"><span>30&quot; Cierra Console Sink with Brass Stand - Polished Nickel</span></div>
                  <div id="image-source">Signature Hardware</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results).toEqual([
      expect.objectContaining({ domain: 'ordinary.example' }),
      expect.objectContaining({
        domain: 'www.signaturehardware.com',
        title: '30" Cierra Console Sink with Brass Stand - Polished Nickel',
        url: 'https://www.signaturehardware.com/30-in-cierra-console-sink-with-brass-stand/912178.html'
      })
    ])
  })

  it('collects every Google All-tab image card even when labelled IDs repeat', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
          <body>
            <div id="search">
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://signaturehardware.example/30-cierra-console-sink"
                ></a>
                <div class="oYLlHe">
                  <img alt="30&quot; Cierra Console Sink" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                </div>
                <div class="T3Fozb">
                  <div id="image-title"><span>30&quot; Cierra Console Sink</span></div>
                  <div id="image-source">Signature Hardware</div>
                </div>
              </div>
              <div class="w43QB EXH1Ce">
                <a
                  aria-labelledby="image-title image-source"
                  class="ddkIM c30Ztd xZGX9"
                  href="https://rejuvenation.example/winslow-marble-vanity"
                ></a>
                <div class="oYLlHe">
                  <img alt="Winslow Marble Vanity" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
                </div>
                <div class="T3Fozb">
                  <div id="image-title"><span>Winslow Marble Vanity</span></div>
                  <div id="image-source">Rejuvenation</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results).toEqual([
      expect.objectContaining({
        domain: 'signaturehardware.example',
        title: '30" Cierra Console Sink',
        url: 'https://signaturehardware.example/30-cierra-console-sink'
      }),
      expect.objectContaining({
        domain: 'rejuvenation.example',
        title: 'Winslow Marble Vanity',
        url: 'https://rejuvenation.example/winslow-marble-vanity'
      })
    ])
  })

  it('collects Google All-tab image cards added after Show more images expands the block', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>console sink - Google Search</title></head>
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

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=console+sink'
    })

    expect(signals.results).toEqual([
      expect.objectContaining({ domain: 'signaturehardware.example' }),
      expect.objectContaining({ domain: 'rejuvenation.example' })
    ])
  })

  it('collects Google All-tab image cards when thumbnail links and metadata are sibling nodes', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>pedestal sink - Google Search</title></head>
          <body>
            <div id="search">
              <div class="google-image-block">
                <div class="google-image-card">
                  <a href="https://signaturehardware.example/pennfield-porcelain-pedestal">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:1" />
                  </a>
                  <div class="google-image-metadata">
                    <div>Pennfield Porcelain Pedestal ...</div>
                    <div>Signature Hardware</div>
                  </div>
                </div>
                <div class="google-image-card">
                  <a href="https://homedepot.example/best-pedestal-sinks">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:2" />
                  </a>
                  <div class="google-image-metadata">
                    <div>Best Pedestal Sinks for Your B...</div>
                    <div>The Home Depot</div>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'text/html'
    )

    const signals = collectSearchResultSignalsFromDocument(document, {
      href: 'https://www.google.com/search?q=pedestal+sink'
    })

    expect(signals.results).toEqual([
      expect.objectContaining({
        domain: 'signaturehardware.example',
        title: expect.stringContaining('Pennfield Porcelain Pedestal'),
        url: 'https://signaturehardware.example/pennfield-porcelain-pedestal'
      }),
      expect.objectContaining({
        domain: 'homedepot.example',
        title: expect.stringContaining('Best Pedestal Sinks'),
        url: 'https://homedepot.example/best-pedestal-sinks'
      })
    ])
  })

  it('keeps the injected current-page collector self-contained after function serialization', () => {
    const document = new DOMParser().parseFromString(
      `
        <html>
          <head><title>Serrano Fixtures - About</title></head>
          <body>
            <h1>Serrano Fixtures</h1>
            <a href="mailto:imports@serrano-fixtures.example">Email</a>
          </body>
        </html>
      `,
      'text/html'
    )
    const pageGlobal = {
      document,
      getSelection: () => ({ toString: () => 'Selected lead evidence' }),
      location: {
        hostname: 'www.serrano-fixtures.example',
        href: 'https://www.serrano-fixtures.example/about'
      }
    }
    const serializedCollector = new Function(
      'pageGlobal',
      `
        const globalThis = pageGlobal
        return (${collectCurrentPageSignals.toString()})()
      `
    )

    expect(serializedCollector(pageGlobal)).toMatchObject({
      page: {
        companyNameCandidates: ['Serrano Fixtures'],
        domain: 'www.serrano-fixtures.example',
        pageKind: 'OFFICIAL_SITE',
        title: 'Serrano Fixtures - About',
        url: 'https://www.serrano-fixtures.example/about',
        visibleEmails: ['imports@serrano-fixtures.example']
      }
    })
  })
})
