<script setup lang="ts">
interface PolicyPageSection {
  id: string
  label: string
  index: string
  heading: string
  paragraphs: string[]
  bullets?: string[]
  support?: boolean
}

const props = withDefaults(defineProps<{
  headingId: string
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: PolicyPageSection[]
  contactLabel?: string
}>(), {
  contactLabel: 'Contact Customer Care'
})

const activeSectionId = ref<string | null>(null)

// jumpToSection smoothly moves to a policy section while preserving a shareable location hash.
function jumpToSection(sectionId: string): void {
  activeSectionId.value = sectionId

  if (!import.meta.client) {
    return
  }

  const section = document.getElementById(sectionId)
  if (!section) {
    return
  }

  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${sectionId}`)
}

// syncActiveSectionFromHash reflects direct links and browser navigation in the policy table of contents.
function syncActiveSectionFromHash(): void {
  if (!import.meta.client) {
    return
  }

  const sectionId = window.location.hash.slice(1)
  activeSectionId.value = props.sections.some((section) => section.id === sectionId) ? sectionId : null
}

onMounted(() => {
  syncActiveSectionFromHash()
  window.addEventListener('hashchange', syncActiveSectionFromHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncActiveSectionFromHash)
})
</script>

<template>
  <main class="dxv-policy-page" :aria-labelledby="headingId">
    <header class="dxv-policy-page__hero">
      <div class="dxv-policy-page__shell">
        <p class="dxv-policy-page__eyebrow">{{ eyebrow }}</p>
        <h1 :id="headingId">{{ title }}</h1>
        <p class="dxv-policy-page__intro">{{ intro }}</p>
        <p class="dxv-policy-page__updated">{{ updated }}</p>
      </div>
    </header>

    <div class="dxv-policy-page__shell dxv-policy-page__layout">
      <aside class="dxv-policy-page__contents" aria-label="On this page">
        <p>On this page</p>
        <nav class="dxv-policy-page__contents-rail">
          <a
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            :aria-current="activeSectionId === section.id ? 'page' : undefined"
            @click.prevent="jumpToSection(section.id)"
          >
            {{ section.label }}
          </a>
        </nav>
      </aside>

      <div class="dxv-policy-page__content">
        <section
          v-for="section in sections"
          :id="section.id"
          :key="section.id"
          :class="section.support ? 'dxv-policy-page__support' : 'dxv-policy-page__section'"
          :aria-labelledby="`${section.id}-title`"
        >
          <p class="dxv-policy-page__section-index">{{ section.index }}</p>
          <h2 :id="`${section.id}-title`">{{ section.heading }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.bullets?.length" class="dxv-policy-page__checklist">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
          <NuxtLink v-if="section.support" to="/contact">
            {{ contactLabel }} <span aria-hidden="true">→</span>
          </NuxtLink>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dxv-policy-page {
  --policy-ink: #252525;
  --policy-muted: #686862;
  --policy-line: #d7d5ce;
  --policy-paper: #ffffff;
  min-height: 100dvh;
  overflow: clip;
  padding: 167px 0 128px;
  background: var(--policy-paper);
  color: var(--policy-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
}

.dxv-policy-page__shell {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.dxv-policy-page__hero {
  border-bottom: 1px solid var(--policy-line);
  background: var(--policy-paper);
  padding-bottom: 72px;
}

.dxv-policy-page__eyebrow,
.dxv-policy-page__section-index,
.dxv-policy-page__contents > p,
.dxv-policy-page__updated {
  margin: 0;
  color: var(--policy-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.35;
  text-transform: uppercase;
}

.dxv-policy-page__content h2,
.dxv-policy-page__support h2 {
  margin: 0;
  color: var(--policy-ink);
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 500;
  letter-spacing: -0.035em;
}

.dxv-policy-page__hero h1 {
  max-width: 760px;
  margin: 18px 0 0;
  color: var(--policy-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
  font-size: clamp(2.7rem, 4.35vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
}

.dxv-policy-page__intro {
  max-width: 590px;
  margin: 24px 0 0;
  color: var(--policy-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.dxv-policy-page__updated {
  margin-top: 24px;
}

.dxv-policy-page__layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: clamp(48px, 8vw, 128px);
  padding-top: 58px;
}

.dxv-policy-page__contents {
  align-self: start;
  position: sticky;
  top: 110px;
}

.dxv-policy-page__contents-rail {
  display: grid;
  gap: 13px;
  margin-top: 20px;
}

.dxv-policy-page__contents-rail a {
  width: fit-content;
  color: var(--policy-ink);
  font-size: 0.9rem;
  line-height: 1.4;
  text-decoration: none;
}

.dxv-policy-page__contents-rail a::after {
  display: block;
  width: 0;
  height: 1px;
  margin-top: 3px;
  background: currentColor;
  content: "";
  transition: width 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-policy-page__contents-rail a:hover::after,
.dxv-policy-page__contents-rail a:focus-visible::after,
.dxv-policy-page__contents-rail a[aria-current='page']::after {
  width: 100%;
}

.dxv-policy-page__contents-rail a:focus-visible,
.dxv-policy-page__support a:focus-visible {
  outline: 2px solid var(--policy-ink);
  outline-offset: 4px;
}

.dxv-policy-page__content {
  min-width: 0;
}

.dxv-policy-page__section,
.dxv-policy-page__support {
  scroll-margin-top: 132px;
  border-top: 1px solid var(--policy-line);
  padding: 34px 0 52px;
}

.dxv-policy-page__content > :first-child {
  border-top: 0;
  padding-top: 0;
}

.dxv-policy-page__content h2,
.dxv-policy-page__support h2 {
  max-width: 17ch;
  margin-top: 16px;
  font-size: clamp(2.15rem, 4vw, 3.75rem);
  line-height: 0.98;
}

.dxv-policy-page__section > p:not(.dxv-policy-page__section-index),
.dxv-policy-page__support > p:not(.dxv-policy-page__section-index) {
  max-width: 68ch;
  margin: 24px 0 0;
  color: #4f4f4b;
  font-size: 1rem;
  line-height: 1.75;
}

.dxv-policy-page__checklist {
  display: grid;
  gap: 12px;
  max-width: 68ch;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.dxv-policy-page__checklist li {
  position: relative;
  padding-left: 20px;
  color: #4f4f4b;
  font-size: 1rem;
  line-height: 1.65;
}

.dxv-policy-page__checklist li::before {
  position: absolute;
  top: 0.68em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--policy-ink);
  content: "";
}

.dxv-policy-page__support {
  border-bottom: 1px solid var(--policy-line);
}

.dxv-policy-page__support a {
  position: relative;
  display: inline-flex;
  width: fit-content;
  margin-top: 30px;
  padding-bottom: 6px;
  color: var(--policy-ink);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-decoration: none;
  text-transform: uppercase;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-policy-page__support a::after {
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

.dxv-policy-page__support a:hover::after,
.dxv-policy-page__support a:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;
}

.dxv-policy-page__support a:active {
  transform: translateY(1px);
}

.dxv-policy-page__support a span {
  display: inline-block;
  margin-left: 12px;
  font-size: 1rem;
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-policy-page__support a:hover span,
.dxv-policy-page__support a:focus-visible span {
  transform: translateX(4px);
}

@media (max-width: 800px) {
  .dxv-policy-page {
    padding: 96px 0 72px;
  }

  .dxv-policy-page__shell {
    width: min(100% - 32px, 1240px);
  }

  .dxv-policy-page__hero {
    padding-bottom: 40px;
  }

  .dxv-policy-page__hero h1 {
    font-size: clamp(2.45rem, 11vw, 3.45rem);
  }

  .dxv-policy-page__layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 48px;
  }

  .dxv-policy-page__contents {
    position: static;
  }

  .dxv-policy-page__contents > p {
    display: block;
    margin-bottom: 12px;
  }

  .dxv-policy-page__contents-rail {
    display: flex;
    width: calc(100% + 32px);
    overflow-x: auto;
    gap: 22px;
    margin: 0 0 0 -16px;
    border-top: 1px solid var(--policy-line);
    border-bottom: 1px solid var(--policy-line);
    overscroll-behavior-x: contain;
    padding: 0 16px;
    scroll-padding-inline: 16px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    user-select: none;
  }

  .dxv-policy-page__contents-rail::-webkit-scrollbar {
    display: none;
  }

  .dxv-policy-page__contents-rail a {
    position: relative;
    flex: 0 0 auto;
    width: auto;
    padding: 14px 0 12px;
    font-size: 0.8125rem;
    letter-spacing: 0.015em;
    line-height: 1.4;
    scroll-snap-align: start;
    white-space: nowrap;
  }

  .dxv-policy-page__contents-rail a::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    width: auto;
    height: 2px;
    margin-top: 0;
    opacity: 0;
    transform: scaleX(0.5);
    transform-origin: center;
    transition: opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dxv-policy-page__contents-rail a[aria-current='page']::after {
    width: auto;
    opacity: 1;
    transform: scaleX(1);
  }

  .dxv-policy-page__section,
  .dxv-policy-page__support {
    scroll-margin-top: 90px;
  }

  .dxv-policy-page__content h2,
  .dxv-policy-page__support h2 {
    max-width: 14ch;
    font-size: clamp(2rem, 10vw, 3rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dxv-policy-page *,
  .dxv-policy-page *::before,
  .dxv-policy-page *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
