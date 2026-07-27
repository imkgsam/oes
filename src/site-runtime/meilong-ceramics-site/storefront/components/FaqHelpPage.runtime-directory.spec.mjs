import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('../pages/faqs.vue', import.meta.url)
const componentUrl = new URL('./FaqHelpPage.vue', import.meta.url)

// This contract test keeps the FAQ page bound to one typed Runtime directory for display and schema data.
test('FAQ page derives ordered display categories and FAQPage JSON-LD from the local Runtime directory', async () => {
  const [page, component] = await Promise.all([
    readFile(pageUrl, 'utf8'),
    readFile(componentUrl, 'utf8')
  ])

  assert.match(page, /type FaqDirectoryPublicView/)
  assert.match(page, /\/api\/public\/resources\/faqs/)
  assert.doesNotMatch(page, /faqCategories/)
  assert.doesNotMatch(page, /\bany\b/)
  assert.match(page, /const publishedDirectory = directory\.value/)
  assert.match(page, /mapFaqDirectory\(publishedDirectory\)/)
  assert.match(page, /\.sort\(compareFaqCategories\)/)
  assert.match(page, /\.sort\(compareFaqEntries\)/)
  assert.match(page, /answerHtml:\s*entry\.answer_html/)
  assert.match(page, /buildFaqPageStructuredData\([\s\S]*?categories\.value/)
  assert.match(page, /<FaqHelpPage\s+:categories="categories"\s*\/>/)

  assert.doesNotMatch(component, /faqCategories/)
  assert.match(component, /v-for="category in categories"/)
  assert.match(component, /v-for="question in category\.questions"/)
  assert.match(component, /:id="category\.id"/)
  assert.match(component, /v-html="question\.answerHtml"/)
  assert.match(component, /<NuxtLink to="\/contact">Contact Customer Service<\/NuxtLink>/)
})
