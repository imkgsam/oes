import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const cdpAddress = '127.0.0.1'
const cdpPort = 9222
const cdpUrl = `http://${cdpAddress}:${cdpPort}`
const profilePath = join(homedir(), '.codex', 'oes-reference-browser')
const defaultPageUrl = 'https://www.westelm.com/shop-by-style/kids/?cm_src=OLDLINK&cm_re=ShopFeature-*-SBRSmallSpaces-*-KidsRoomInspiration'
const pageUrl = readPageUrl(process.argv.slice(2))

await startReferenceBrowser()

// readPageUrl accepts one explicit page URL while keeping the reference page as the default.
function readPageUrl(args) {
  if (args.length === 0) {
    return defaultPageUrl
  }

  if (args.length === 2 && args[0] === '--url') {
    return new URL(args[1]).toString()
  }

  throw new Error('Usage: pnpm reference:browser [--url <https://example.com>]')
}

// startReferenceBrowser starts an isolated, loopback-only Chrome session or reuses its existing session.
async function startReferenceBrowser() {
  const existingVersion = await getCdpVersion()
  if (existingVersion) {
    console.log(`Reference browser is ready at ${cdpUrl} (${existingVersion.Browser}).`)
    console.log('Open the reference page in that Chrome window, then run: pnpm reference:browser:capture')
    return
  }

  if (!existsSync(chromePath)) {
    throw new Error(`Google Chrome was not found at ${chromePath}. Install Chrome or update this script.`)
  }

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-address=${cdpAddress}`,
      `--remote-debugging-port=${cdpPort}`,
      `--remote-allow-origins=${cdpUrl}`,
      `--user-data-dir=${profilePath}`,
      '--new-window',
      '--no-first-run',
      '--no-default-browser-check',
      pageUrl
    ],
    { detached: true, stdio: 'ignore' }
  )
  chrome.unref()

  const version = await waitForCdp()
  console.log(`Reference browser is ready at ${cdpUrl} (${version.Browser}).`)
  console.log(`Chrome opened ${pageUrl}`)
  console.log('Complete any site challenge manually in that window, then run: pnpm reference:browser:capture')
}

// getCdpVersion confirms that the local endpoint belongs to a Chrome DevTools session.
async function getCdpVersion() {
  try {
    const response = await fetch(`${cdpUrl}/json/version`, { signal: AbortSignal.timeout(750) })
    if (!response.ok) {
      return null
    }

    const version = await response.json()
    return typeof version.Browser === 'string' && version.webSocketDebuggerUrl ? version : null
  } catch {
    return null
  }
}

// waitForCdp waits for Chrome's loopback-only DevTools endpoint without arbitrary browser delays.
async function waitForCdp() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const version = await getCdpVersion()
    if (version) {
      return version
    }
    await delay(150)
  }

  throw new Error(`Chrome started but did not expose CDP at ${cdpUrl} within 15 seconds.`)
}
