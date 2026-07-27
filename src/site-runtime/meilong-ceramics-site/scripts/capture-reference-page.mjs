import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { chromium } from 'playwright'

const cdpUrl = 'http://127.0.0.1:9222'
const defaultPageMatch = 'www.westelm.com/shop-by-style/kids/'
const options = readOptions(process.argv.slice(2).filter((argument) => argument !== '--'))

await captureReferencePage()

// readOptions parses a URL substring and optional capture name without allowing page navigation commands.
function readOptions(args) {
  const options = { pageMatch: defaultPageMatch, name: 'reference-page' }
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index]
    const value = args[index + 1]
    if ((option === '--url' || option === '--name') && value) {
      options[option === '--url' ? 'pageMatch' : 'name'] = value
      index += 1
      continue
    }
    throw new Error('Usage: pnpm reference:browser:capture [--url <page-url-substring>] [--name <capture-name>]')
  }
  return options
}

// captureReferencePage saves an already-authorized browser page without changing its state or credentials.
async function captureReferencePage() {
  const browser = await chromium.connectOverCDP(cdpUrl)
  try {
    const page = findOpenPage(browser, options.pageMatch)
    const captureDirectory = join(process.cwd(), 'tmp', 'reference-captures')
    const captureBaseName = `${timestamp()}-${safeName(options.name)}`
    const screenshotPath = join(captureDirectory, `${captureBaseName}.png`)
    const htmlPath = join(captureDirectory, `${captureBaseName}.html`)
    const textPath = join(captureDirectory, `${captureBaseName}.txt`)
    const metadataPath = join(captureDirectory, `${captureBaseName}.json`)

    await mkdir(captureDirectory, { recursive: true })
    await page.screenshot({ path: screenshotPath, fullPage: true })
    await writeFile(htmlPath, await page.content(), 'utf8')
    await writeFile(textPath, await page.locator('body').innerText(), 'utf8')
    await writeFile(
      metadataPath,
      `${JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          title: await page.title(),
          url: page.url(),
          viewport: page.viewportSize()
        },
        null,
        2
      )}\n`,
      'utf8'
    )

    console.log(`Captured ${page.url()}`)
    console.log(`Screenshot: ${screenshotPath}`)
    console.log(`HTML: ${htmlPath}`)
    console.log(`Text: ${textPath}`)
    console.log(`Metadata: ${metadataPath}`)
  } finally {
    await browser.close()
  }
}

// findOpenPage selects the latest page matching the requested URL substring from the authorized Chrome session.
function findOpenPage(browser, pageMatch) {
  const pages = browser.contexts().flatMap((context) => context.pages())
  const page = [...pages].reverse().find((candidate) => candidate.url().includes(pageMatch))
  if (page) {
    return page
  }

  const openPages = pages.map((candidate) => candidate.url()).join('\n- ')
  throw new Error(`No open page matched "${pageMatch}". Open it in the reference Chrome window first.\n- ${openPages || '(no pages)'}`)
}

// safeName converts a user supplied label into a portable capture filename.
function safeName(name) {
  return basename(name).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'reference-page'
}

// timestamp creates a sortable filename prefix without locale-dependent characters.
function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}
