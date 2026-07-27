import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('../pages/returns-refunds.vue', import.meta.url)
const warrantyUrl = new URL('../pages/warranty.vue', import.meta.url)

// This regression test keeps returns and refunds as a dedicated, actionable policy rather than a warranty subsection.
test('Returns and refunds has a dedicated policy page with eligibility, authorization, damage, and refund guidance', async () => {
  const page = await readFile(pageUrl, 'utf8').catch(() => '')

  assert.match(page, /<h1 id="returns-refunds-title">Returns &amp; Refunds<\/h1>/)
  assert.match(page, /class="dxv-return-policy__shell dxv-return-policy__layout"/)
  assert.match(page, /180 calendar days from the purchase date/)
  assert.match(page, /Return Goods Authorization \(RGA\)/)
  assert.match(page, /25% restocking fee/)
  assert.match(page, /within 48 hours of receipt/)
  assert.match(page, /original payment method/)
  assert.match(page, /custom, made-to-order, special-order, and drop-shipped items/i)
})

// This regression test keeps return policy ownership out of the separate warranty page.
test('Warranty remains a dedicated coverage page after returns moves to its own route', async () => {
  const warranty = await readFile(warrantyUrl, 'utf8')

  assert.match(warranty, /<PolicyPageShell/)
  assert.match(warranty, /title="Warranty"/)
  assert.doesNotMatch(warranty, /<h2>Returns<\/h2>/)
  assert.doesNotMatch(warranty, /SATISFACTION GUARANTEED/)
})

// This regression test keeps the return-support action aligned with the site's flowing underline link treatment.
test('Return support action uses a flowing underline and a restrained arrow motion on hover', async () => {
  const page = await readFile(pageUrl, 'utf8')

  assert.match(page, /\.dxv-return-policy__support a::after[\s\S]*transform: scaleX\(0\)/)
  assert.match(page, /\.dxv-return-policy__support a:hover::after[\s\S]*transform: scaleX\(1\)/)
  assert.match(page, /\.dxv-return-policy__support a:hover span[\s\S]*transform: translateX\(/)
})
