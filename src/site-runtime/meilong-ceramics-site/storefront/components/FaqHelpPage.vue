<script setup lang="ts">
type FaqCategory = { id: string; title: string; sort: number; questions: Array<{ id: string; question: string; answerHtml: string }> }
const props = defineProps<{ categories: FaqCategory[] }>()

const openQuestionId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)

// toggleQuestion keeps one FAQ answer open at a time while allowing the active question to close again.
function toggleQuestion(questionId: string): void {
  openQuestionId.value = openQuestionId.value === questionId ? null : questionId
}

// closeOpenQuestion clears an expanded answer when a reader dismisses the accordion with Escape.
function closeOpenQuestion(): void {
  openQuestionId.value = null
}

// jumpToCategory selects an FAQ category link, smoothly scrolls to its group, and preserves a shareable section hash.
function jumpToCategory(categoryId: string): void {
  selectedCategoryId.value = categoryId

  if (!import.meta.client) {
    return
  }

  const category = document.getElementById(categoryId)
  if (!category) {
    return
  }

  category.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${categoryId}`)
}

// syncSelectedCategoryFromHash keeps the mobile category rail in sync with direct links and desktop anchor navigation.
function syncSelectedCategoryFromHash(): void {
  if (!import.meta.client) {
    return
  }

  const categoryId = window.location.hash.slice(1)
  selectedCategoryId.value = props.categories.some((category) => category.id === categoryId) ? categoryId : null
}

onMounted(() => {
  syncSelectedCategoryFromHash()
  window.addEventListener('hashchange', syncSelectedCategoryFromHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncSelectedCategoryFromHash)
})
</script>

<template>
  <main class="dxv-faq-page" aria-labelledby="faq-page-title">
    <header class="dxv-faq-page__hero">
      <div class="dxv-faq-page__inner">
        <p class="dxv-faq-page__eyebrow">Help &amp; Support</p>
        <h1 id="faq-page-title">FAQ / Help</h1>
        <p class="dxv-faq-page__intro">
          Answers to common questions about ordering, product care, and support.
        </p>
      </div>
    </header>

    <div class="dxv-faq-page__inner dxv-faq-page__layout">
      <nav class="dxv-faq-page__category-nav" aria-label="FAQ categories">
        <span class="dxv-faq-page__category-label">Browse by category</span>
        <div class="dxv-faq-page__mobile-category-rail" aria-label="Choose an FAQ category">
          <a
            v-for="category in categories"
            :key="category.id"
            :href="`#${category.id}`"
            :aria-current="selectedCategoryId === category.id ? 'page' : undefined"
            @click.prevent="jumpToCategory(category.id)"
          >
            {{ category.title }}
          </a>
        </div>
        <div class="dxv-faq-page__category-links">
          <a
            v-for="category in categories"
            :key="category.id"
            :href="`#${category.id}`"
            @click.prevent="jumpToCategory(category.id)"
          >
            {{ category.title }}
          </a>
        </div>
      </nav>

      <div class="dxv-faq-page__content" @keydown.esc="closeOpenQuestion">
        <section
          v-for="category in categories"
          :id="category.id"
          :key="category.id"
          class="dxv-faq-page__category"
          :aria-labelledby="`${category.id}-title`"
        >
          <header class="dxv-faq-page__category-heading">
            <span aria-hidden="true">{{ String(category.sort / 10).padStart(2, '0') }}</span>
            <h2 :id="`${category.id}-title`">{{ category.title }}</h2>
          </header>

          <div class="dxv-faq-page__questions">
            <article
              v-for="question in category.questions"
              :key="question.id"
              class="dxv-faq-page__item"
              :class="{ 'is-open': openQuestionId === question.id }"
            >
              <h3>
                <button
                  :id="`faq-question-${question.id}`"
                  type="button"
                  :aria-controls="`faq-answer-${question.id}`"
                  :aria-expanded="openQuestionId === question.id"
                  @click="toggleQuestion(question.id)"
                >
                  <span>{{ question.question }}</span>
                  <span class="dxv-faq-page__toggle-mark" aria-hidden="true" />
                </button>
              </h3>
              <div
                :id="`faq-answer-${question.id}`"
                class="dxv-faq-page__answer"
                role="region"
                :aria-hidden="openQuestionId !== question.id"
                :aria-labelledby="`faq-question-${question.id}`"
              >
                <div class="dxv-faq-page__answer-inner">
                  <div v-html="question.answerHtml" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <aside class="dxv-faq-page__support" aria-label="More support options">
          <div>
            <span>Still need a hand?</span>
            <p>For product-specific or order-specific guidance, our support team can help you find the right next step.</p>
          </div>
          <NuxtLink to="/contact">Contact Customer Service</NuxtLink>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dxv-faq-page {
  --faq-ink: var(--dxv-black, #1d1d1d);
  --faq-line: var(--dxv-gray-300, #d8d8d8);
  --faq-muted: var(--dxv-gray-700, #383838);
  --faq-paper: var(--dxv-white, #ffffff);
  --faq-subtle: var(--dxv-offwhite, #f6f3ed);
  min-height: 100dvh;
  overflow: clip;
  padding: 167px 0 128px;
  background: var(--faq-paper);
  color: var(--faq-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
}

.dxv-faq-page *,
.dxv-faq-page *::before,
.dxv-faq-page *::after {
  box-sizing: border-box;
}

.dxv-faq-page__inner {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.dxv-faq-page__hero {
  padding-bottom: 72px;
  background: var(--faq-paper);
  border-bottom: 1px solid var(--faq-line);
}

.dxv-faq-page__eyebrow,
.dxv-faq-page__category-label,
.dxv-faq-page__category-heading > span,
.dxv-faq-page__support > div > span {
  margin: 0;
  color: var(--faq-muted);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.13em;
  line-height: 1.4;
  text-transform: uppercase;
}

.dxv-faq-page h1,
.dxv-faq-page h2,
.dxv-faq-page h3,
.dxv-faq-page p {
  margin: 0;
}

.dxv-faq-page h1 {
  max-width: 760px;
  margin-top: 18px;
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
  font-size: clamp(2.7rem, 4.35vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
}

.dxv-faq-page__intro {
  max-width: 530px;
  margin-top: 24px;
  color: var(--faq-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.dxv-faq-page__layout {
  display: grid;
  grid-template-columns: 192px minmax(0, 1fr);
  gap: clamp(48px, 7vw, 112px);
  padding-top: 58px;
}

.dxv-faq-page__category-nav {
  align-self: start;
  position: sticky;
  top: 139px;
}

.dxv-faq-page__category-links {
  display: grid;
  gap: 0;
  margin-top: 17px;
  border-top: 1px solid var(--faq-line);
}

.dxv-faq-page__mobile-category-rail {
  display: none;
}

.dxv-faq-page__category-links a {
  padding: 10px 0;
  border-bottom: 1px solid var(--faq-line);
  color: var(--faq-ink);
  font-size: 0.75rem;
  letter-spacing: 0.015em;
  line-height: 1.36;
  text-decoration: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

.dxv-faq-page__category-links a:hover {
  opacity: 0.62;
  transform: translateX(3px);
}

.dxv-faq-page__category-links a:focus-visible,
.dxv-faq-page__mobile-category-rail a:focus-visible,
.dxv-faq-page__item button:focus-visible,
.dxv-faq-page__support a:focus-visible {
  outline: 2px solid var(--faq-ink);
  outline-offset: 4px;
}

.dxv-faq-page__category {
  scroll-margin-top: 145px;
}

.dxv-faq-page__category + .dxv-faq-page__category {
  margin-top: 82px;
}

.dxv-faq-page__category-heading {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  padding-bottom: 19px;
  border-bottom: 1px solid var(--faq-ink);
}

.dxv-faq-page__category-heading h2 {
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
  font-size: clamp(1.65rem, 2.15vw, 2.35rem);
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.08;
}

.dxv-faq-page__questions {
  border-bottom: 1px solid var(--faq-line);
}

.dxv-faq-page__item {
  position: relative;
  border-top: 1px solid var(--faq-line);
}

.dxv-faq-page__item:first-child {
  border-top: 0;
}

.dxv-faq-page__item h3 {
  font-size: inherit;
  font-weight: inherit;
}

.dxv-faq-page__item button {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 24px;
  align-items: center;
  border: 0;
  background: transparent;
  padding: 24px 0;
  color: inherit;
  font: inherit;
  font-size: clamp(0.95rem, 1.25vw, 1.125rem);
  line-height: 1.43;
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease;
}

.dxv-faq-page__item button:active {
  transform: translateY(1px);
}

.dxv-faq-page__item button > span:first-child {
  position: relative;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
}

.dxv-faq-page__item button > span:first-child::after {
  position: absolute;
  right: 0;
  bottom: -4px;
  left: 0;
  height: 1px;
  background: currentColor;
  content: '';
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-faq-page__toggle-mark {
  position: relative;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  justify-self: end;
  color: var(--faq-ink);
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (hover: hover) {
  .dxv-faq-page__item:hover button > span:first-child::after {
    transform: scaleX(1);
    transform-origin: left center;
  }
}

.dxv-faq-page__toggle-mark::before,
.dxv-faq-page__toggle-mark::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 1px;
  background: currentColor;
  content: '';
  transform: translate(-50%, -50%);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-faq-page__toggle-mark::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.dxv-faq-page__item.is-open .dxv-faq-page__toggle-mark::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

.dxv-faq-page__answer {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
}

.dxv-faq-page__item.is-open .dxv-faq-page__answer {
  grid-template-rows: 1fr;
  opacity: 1;
}

.dxv-faq-page__answer-inner {
  min-height: 0;
  overflow: hidden;
}

.dxv-faq-page__answer p {
  max-width: 690px;
  padding: 0 52px 29px 0;
  color: var(--faq-muted);
  font-size: 0.9375rem;
  line-height: 1.72;
  transform: translateY(-6px);
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-faq-page__item.is-open .dxv-faq-page__answer p {
  transform: translateY(0);
}

.dxv-faq-page__support {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 84px;
  padding: 29px 0 0;
  border-top: 1px solid var(--faq-ink);
}

.dxv-faq-page__support p {
  max-width: 480px;
  margin-top: 10px;
  color: var(--faq-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}

.dxv-faq-page__support a {
  position: relative;
  flex: 0 0 auto;
  padding-bottom: 6px;
  color: var(--faq-ink);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-decoration: none;
  text-transform: uppercase;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-faq-page__support a::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: currentColor;
  content: "";
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-faq-page__support a:hover::after,
.dxv-faq-page__support a:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;
}

.dxv-faq-page__support a:active {
  transform: translateY(1px);
}

@media (max-width: 1279px) {
  .dxv-faq-page {
    padding-top: 104px;
  }

  .dxv-faq-page__category-nav {
    top: 82px;
  }

  .dxv-faq-page__category {
    scroll-margin-top: 78px;
  }
}

@media (max-width: 760px) {
  .dxv-faq-page {
    padding: 96px 0 72px;
  }

  .dxv-faq-page__inner {
    width: min(100% - 32px, 1240px);
  }

  .dxv-faq-page__hero {
    padding-bottom: 40px;
  }

  .dxv-faq-page h1 {
    font-size: clamp(2.5rem, 11.6vw, 3.45rem);
  }

  .dxv-faq-page__layout {
    display: block;
    padding-top: 0;
  }

  .dxv-faq-page__category-nav {
    position: static;
    width: auto;
    margin: 0;
    padding: 26px 0 44px;
  }

  .dxv-faq-page__category-label {
    display: block;
    margin-bottom: 12px;
  }

  .dxv-faq-page__category-links {
    display: none;
  }

  .dxv-faq-page__mobile-category-rail {
    display: flex;
    width: calc(100% + 32px);
    gap: 22px;
    margin-left: -16px;
    border-top: 1px solid var(--faq-line);
    border-bottom: 1px solid var(--faq-line);
    overflow-x: auto;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    padding: 0 16px;
    scroll-padding-inline: 16px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    user-select: none;
  }

  .dxv-faq-page__mobile-category-rail::-webkit-scrollbar {
    display: none;
  }

  .dxv-faq-page__mobile-category-rail a {
    position: relative;
    flex: 0 0 auto;
    padding: 14px 0 12px;
    color: var(--faq-ink);
    font-size: 0.8125rem;
    letter-spacing: 0.015em;
    line-height: 1.4;
    scroll-snap-align: start;
    text-decoration: none;
    white-space: nowrap;
  }

  .dxv-faq-page__mobile-category-rail a::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: currentColor;
    content: '';
    opacity: 0;
    transform: scaleX(0.5);
    transition: opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dxv-faq-page__mobile-category-rail a[aria-current='page']::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .dxv-faq-page__category {
    scroll-margin-top: 68px;
  }

  .dxv-faq-page__category + .dxv-faq-page__category {
    margin-top: 58px;
  }

  .dxv-faq-page__category-heading {
    grid-template-columns: 34px minmax(0, 1fr);
    padding-bottom: 16px;
  }

  .dxv-faq-page__category-heading h2 {
    font-size: clamp(1.55rem, 7.6vw, 2rem);
  }

  .dxv-faq-page__item button {
    min-height: 68px;
    padding: 18px 0;
  }

  .dxv-faq-page__answer p {
    padding-right: 8px;
    font-size: 0.875rem;
  }

  .dxv-faq-page__support {
    display: grid;
    align-items: start;
    margin-top: 58px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dxv-faq-page *,
  .dxv-faq-page *::before,
  .dxv-faq-page *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
