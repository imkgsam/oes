import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./FaqHelpPage.vue', import.meta.url)

// This regression check keeps icon motion exclusive to accordion state changes while retaining the text underline hover.
test('FAQ accordion animates the icon only while opening or closing and reveals a flowing question underline on hover', async () => {
  const component = await readFile(componentUrl, 'utf8')

  assert.doesNotMatch(
    component,
    /\.dxv-faq-page__item:hover,\s*\.dxv-faq-page__item:focus-within\s*\{[\s\S]*?(?:background|box-shadow)/,
  )
  assert.doesNotMatch(
    component,
    /\.dxv-faq-page__item:hover button > span:first-child,[\s\S]*?transform:\s*translateX/,
  )
  assert.doesNotMatch(
    component,
    /\.dxv-faq-page__item:hover \.dxv-faq-page__toggle-mark\s*\{[^}]*(?:background|color|scale\()/,
  )
  assert.doesNotMatch(
    component,
    /\.dxv-faq-page__item:hover \.dxv-faq-page__toggle-mark\s*\{[^}]*transform/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__toggle-mark::before,[\s\S]*?\.dxv-faq-page__toggle-mark::after\s*\{[\s\S]*?transition:\s*transform/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__item\.is-open \.dxv-faq-page__toggle-mark::after\s*\{[\s\S]*?transform:\s*translate\(-50%, -50%\) rotate\(0deg\)/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__item button > span:first-child::after\s*\{[\s\S]*?transform:\s*scaleX\(0\)[\s\S]*?transform-origin:\s*right center/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__item:hover button > span:first-child::after\s*\{[\s\S]*?transform:\s*scaleX\(1\)[\s\S]*?transform-origin:\s*left center/,
  )
  assert.doesNotMatch(
    component,
    /\.dxv-faq-page__support a\s*\{[^}]*border-bottom:/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__support a::after\s*\{[\s\S]*?transform:\s*scaleX\(0\)[\s\S]*?transform-origin:\s*right/,
  )
  assert.match(
    component,
    /\.dxv-faq-page__support a:hover::after,[\s\S]*?\.dxv-faq-page__support a:focus-visible::after\s*\{[\s\S]*?transform:\s*scaleX\(1\)[\s\S]*?transform-origin:\s*left/,
  )
})
