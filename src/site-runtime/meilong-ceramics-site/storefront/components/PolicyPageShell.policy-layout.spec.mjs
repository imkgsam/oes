import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const shellUrl = new URL('./PolicyPageShell.vue', import.meta.url)
const legacyRedirectUrl = new URL('../pages/privacy-policies.vue', import.meta.url)
const footerUrl = new URL('./home/HomeReplicaFooter.vue', import.meta.url)
const privacyPolicyUrl = new URL('../pages/privacy-policy.vue', import.meta.url)
const policyPageUrls = [
  new URL('../pages/warranty.vue', import.meta.url),
  new URL('../pages/privacy-policy.vue', import.meta.url),
  new URL('../pages/terms-conditions.vue', import.meta.url)
]

// This regression test keeps every long-form legal page inside the same responsive policy-page architecture.
test('Warranty, privacy, and terms pages share the policy shell with a swipeable mobile table of contents', async () => {
  const shell = await readFile(shellUrl, 'utf8').catch(() => '')

  assert.match(shell, /aria-label="On this page"/)
  assert.match(shell, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/)
  assert.match(shell, /\.dxv-policy-page__contents-rail\s*\{[\s\S]*?touch-action:\s*pan-x pan-y;/)
  assert.match(shell, /@media \(max-width: 800px\)/)

  for (const policyPageUrl of policyPageUrls) {
    const page = await readFile(policyPageUrl, 'utf8')
    assert.match(page, /<PolicyPageShell/)
    assert.match(page, /:sections="policySections"/)
  }
})

// This regression test keeps the former plural privacy-policy redirect out of the public route table.
test('The obsolete plural privacy-policy route is removed instead of redirecting', async () => {
  const legacyRedirect = await readFile(legacyRedirectUrl, 'utf8').catch(() => '')

  assert.equal(legacyRedirect, '')
})

// This regression test keeps Privacy Rights and the opt-out choice within their distinct Privacy Policy sections.
test('The footer privacy links open distinct sections within the Privacy Policy', async () => {
  const [footer, privacyPolicy] = await Promise.all([
    readFile(footerUrl, 'utf8'),
    readFile(privacyPolicyUrl, 'utf8')
  ])

  assert.match(footer, /label: 'My Privacy Rights', href: '\/privacy-policy#privacy-rights'/)
  assert.match(footer, /label: 'Do Not Sell or Share My Personal Information', href: '\/privacy-policy#do-not-sell'/)
  assert.match(privacyPolicy, /id: 'privacy-rights'/)
  assert.match(privacyPolicy, /id: 'do-not-sell'/)
  assert.match(privacyPolicy, /right to access, correct, delete, or receive a portable copy/i)
  assert.match(privacyPolicy, /right to opt out of the sale or sharing of personal information/i)
  assert.match(privacyPolicy, /heading: 'Do Not Sell or Share My Personal Information'/)
})
