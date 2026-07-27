<script setup lang="ts">
const returnSections = [
  { id: 'return-eligibility', label: 'Return eligibility' },
  { id: 'return-authorization', label: 'Start a return' },
  { id: 'return-preparation', label: 'Prepare your return' },
  { id: 'return-issues', label: 'Damage or incorrect items' },
  { id: 'return-refunds', label: 'Refunds and deductions' },
  { id: 'return-exclusions', label: 'Exclusions and changes' },
  { id: 'return-support', label: 'Need help?' }
]
const activeSectionId = ref<string | null>(null)

// jumpToSection selects a return-policy link, scrolls to its section, and preserves a shareable hash.
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

// syncActiveSectionFromHash keeps the return-policy navigation in sync with direct and shared anchor links.
function syncActiveSectionFromHash(): void {
  if (!import.meta.client) {
    return
  }

  const sectionId = window.location.hash.slice(1)
  activeSectionId.value = returnSections.some((section) => section.id === sectionId) ? sectionId : null
}

onMounted(() => {
  syncActiveSectionFromHash()
  window.addEventListener('hashchange', syncActiveSectionFromHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncActiveSectionFromHash)
})

useSeoMeta({
  title: 'Returns & Refunds | MAIDSTONE | DXV',
  description: 'Return eligibility, authorization, freight preparation, and refund guidance for MAIDSTONE | DXV direct purchases.',
  ogTitle: 'Returns & Refunds | MAIDSTONE | DXV',
  ogDescription: 'Clear, practical guidance for returns, shipping claims, and refunds.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <main class="dxv-return-policy" aria-labelledby="returns-refunds-title">
    <header class="dxv-return-policy__hero">
      <div class="dxv-return-policy__shell">
        <p class="dxv-return-policy__eyebrow">Customer care</p>
        <h1 id="returns-refunds-title">Returns &amp; Refunds</h1>
        <p class="dxv-return-policy__intro">
          A clear path for direct-purchase returns—from confirming eligibility and receiving authorization to preparing freight and understanding your refund.
        </p>
        <p class="dxv-return-policy__updated">Last updated July 19, 2026</p>
      </div>
    </header>

    <div class="dxv-return-policy__shell dxv-return-policy__layout">
      <aside class="dxv-return-policy__contents" aria-label="On this page">
        <p>On this page</p>
        <nav class="dxv-return-policy__contents-rail">
          <a
            v-for="section in returnSections"
            :key="section.id"
            :href="`#${section.id}`"
            :aria-current="activeSectionId === section.id ? 'page' : undefined"
            @click.prevent="jumpToSection(section.id)"
          >
            {{ section.label }}
          </a>
        </nav>
      </aside>

      <div class="dxv-return-policy__content">
        <section id="return-eligibility" class="dxv-return-policy__section" aria-labelledby="return-eligibility-title">
          <p class="dxv-return-policy__section-index">01 / Return eligibility</p>
          <h2 id="return-eligibility-title">Confirm eligibility before you ship</h2>
          <p>
            This policy applies to purchases made directly from MAIDSTONE | DXV. If you purchased through a showroom, distributor, retailer, marketplace, or other seller, please work with that original seller; they control the return and refund process for their order.
          </p>
          <p>
            A return request must be submitted within 180 calendar days from the purchase date. To qualify, a regularly stocked current-model item must be clean, unused, uninstalled, undamaged, complete with its original parts, and protected by its original packaging.
          </p>
        </section>

        <section id="return-authorization" class="dxv-return-policy__section" aria-labelledby="return-authorization-title">
          <p class="dxv-return-policy__section-index">02 / Start a return</p>
          <h2 id="return-authorization-title">Begin with written authorization</h2>
          <p>
            Contact Customer Care before arranging any return. We will review the order and, if the return is eligible, issue a Return Goods Authorization (RGA) with the approved destination and handling instructions. Do not send a product to a showroom, corporate address, or warehouse unless that location is listed on your authorization.
          </p>
          <p>
            Have your order number, product name or SKU, reason for return, and clear photos of the product and packaging ready. This lets us confirm eligibility quickly and determine whether a return, replacement, repair, or freight claim is the appropriate next step.
          </p>
        </section>

        <section id="return-preparation" class="dxv-return-policy__section" aria-labelledby="return-preparation-title">
          <p class="dxv-return-policy__section-index">03 / Prepare your return</p>
          <h2 id="return-preparation-title">Protect the product for its journey back</h2>
          <p>
            Clearly mark the RGA exactly as instructed and keep a copy of the authorization, carrier receipt, and tracking or freight reference. Returns are shipped freight prepaid at the sender’s risk unless Customer Care confirms in writing that the issue is a verified shipping error or product defect.
          </p>
          <p>
            Repack the item with all original protective materials, hardware, manuals, and components. We cannot issue credit for a return that is lost, misdirected, improperly packaged, or damaged while travelling back to the approved facility.
          </p>
        </section>

        <section id="return-issues" class="dxv-return-policy__section" aria-labelledby="return-issues-title">
          <p class="dxv-return-policy__section-index">04 / Damage or incorrect items</p>
          <h2 id="return-issues-title">Inspect first, then let us make it right</h2>
          <p>
            Inspect deliveries before installation and retain every carton and packing material until the product has been checked. For visible freight damage, note the condition with the carrier when possible and take photos of the carton, label, and product.
          </p>
          <p>
            Report shortages, transit damage, missing parts, defects, or an incorrect item within 48 hours of receipt. Verified shipping errors and qualifying product defects are reviewed separately from elective returns and are not subject to the 25% restocking fee.
          </p>
        </section>

        <section id="return-refunds" class="dxv-return-policy__section" aria-labelledby="return-refunds-title-section">
          <p class="dxv-return-policy__section-index">05 / Refunds and deductions</p>
          <h2 id="return-refunds-title-section">Understand what is credited</h2>
          <p>
            We inspect every authorized return after it reaches the approved facility. For an elective return that meets the required condition, a 25% restocking fee is deducted from the product credit. Original shipping, expedited service, and return freight are not refundable unless Customer Care confirms a verified shipping error or defect in writing.
          </p>
          <p>
            Once a return is approved after inspection, any eligible credit is issued to the original payment method. Financial institutions can require additional time before the credit appears on your statement; Customer Care can help confirm the date the refund was issued.
          </p>
        </section>

        <section id="return-exclusions" class="dxv-return-policy__section" aria-labelledby="return-exclusions-title">
          <p class="dxv-return-policy__section-index">06 / Exclusions and changes</p>
          <h2 id="return-exclusions-title">Some orders cannot return to stock</h2>
          <p>
            Custom, made-to-order, special-order, and drop-shipped items are not eligible for return credit unless MAIDSTONE | DXV agrees in writing before shipment. Any approved exception may be subject to supplier cancellation or restocking costs in addition to the standard return conditions.
          </p>
          <p>
            If an order has not entered fulfillment, contact Customer Care promptly to request a cancellation. After shipment, a cancellation is no longer available and any eligible request follows this return process. We will advise whether a replacement, warranty remedy, or separate new order is the most appropriate exchange path for your situation.
          </p>
        </section>

        <section id="return-support" class="dxv-return-policy__support" aria-labelledby="return-support-title">
          <p class="dxv-return-policy__section-index">07 / Return support</p>
          <h2 id="return-support-title">Need help with a return?</h2>
          <p>
            Send Customer Care your order number, product details, reason for the request, and photos when relevant. We will help identify the correct next step before you spend time or money arranging a shipment.
          </p>
          <NuxtLink to="/contact">Contact Customer Care <span aria-hidden="true">→</span></NuxtLink>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dxv-return-policy {
  --return-ink: #252525;
  --return-muted: #686862;
  --return-line: #d7d5ce;
  --return-paper: #ffffff;
  --return-accent: #3c4a46;
  min-height: 100dvh;
  overflow: clip;
  padding: 167px 0 128px;
  background: #fff;
  color: var(--return-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
}

.dxv-return-policy__shell {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.dxv-return-policy__hero {
  border-bottom: 1px solid var(--return-line);
  background: var(--return-paper);
  padding-bottom: 72px;
}

.dxv-return-policy__eyebrow,
.dxv-return-policy__section-index,
.dxv-return-policy__contents > p,
.dxv-return-policy__updated {
  margin: 0;
  color: var(--return-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.35;
  text-transform: uppercase;
}

.dxv-return-policy__content h2,
.dxv-return-policy__support h2 {
  margin: 0;
  color: var(--return-ink);
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 500;
  letter-spacing: -0.035em;
}

.dxv-return-policy__hero h1 {
  max-width: 760px;
  margin: 18px 0 0;
  color: var(--return-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
  font-size: clamp(2.7rem, 4.35vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
}

.dxv-return-policy__intro {
  max-width: 580px;
  margin: 24px 0 0;
  color: var(--return-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.dxv-return-policy__updated {
  margin-top: 24px;
}

.dxv-return-policy__layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: clamp(48px, 8vw, 128px);
  padding-top: 58px;
}

.dxv-return-policy__contents {
  align-self: start;
  position: sticky;
  top: 110px;
}

.dxv-return-policy__contents-rail {
  display: grid;
  gap: 13px;
  margin-top: 20px;
}

.dxv-return-policy__contents-rail a {
  width: fit-content;
  color: var(--return-ink);
  font-size: 0.9rem;
  line-height: 1.4;
  text-decoration: none;
}

.dxv-return-policy__contents-rail a::after {
  display: block;
  width: 0;
  height: 1px;
  margin-top: 3px;
  background: currentColor;
  content: "";
  transition: width 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-return-policy__contents-rail a:hover::after,
.dxv-return-policy__contents-rail a:focus-visible::after,
.dxv-return-policy__contents-rail a[aria-current='page']::after {
  width: 100%;
}

.dxv-return-policy__content {
  min-width: 0;
}

.dxv-return-policy__section,
.dxv-return-policy__support {
  border-top: 1px solid var(--return-line);
  padding: 34px 0 52px;
}

.dxv-return-policy__content > :first-child {
  border-top: 0;
  padding-top: 0;
}

.dxv-return-policy__content h2,
.dxv-return-policy__support h2 {
  max-width: 15ch;
  margin-top: 16px;
  font-size: clamp(2.15rem, 4vw, 3.75rem);
  line-height: 0.98;
}

.dxv-return-policy__section > p:not(.dxv-return-policy__section-index),
.dxv-return-policy__support > p:not(.dxv-return-policy__section-index) {
  max-width: 68ch;
  margin: 24px 0 0;
  color: #4f4f4b;
  font-size: 1rem;
  line-height: 1.75;
}

.dxv-return-policy__section strong {
  color: var(--return-ink);
  font-weight: 600;
}

.dxv-return-policy__support {
  border-bottom: 1px solid var(--return-line);
}

.dxv-return-policy__support a {
  position: relative;
  display: inline-flex;
  width: fit-content;
  margin-top: 30px;
  padding-bottom: 6px;
  color: var(--return-ink);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-decoration: none;
  text-transform: uppercase;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-return-policy__support a::after {
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

.dxv-return-policy__support a:hover::after,
.dxv-return-policy__support a:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;
}

.dxv-return-policy__support a:active {
  transform: translateY(1px);
}

.dxv-return-policy__support a span {
  display: inline-block;
  margin-left: 12px;
  font-size: 1rem;
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-return-policy__support a:hover span,
.dxv-return-policy__support a:focus-visible span {
  transform: translateX(4px);
}

@media (max-width: 800px) {
  .dxv-return-policy {
    padding: 96px 0 72px;
  }

  .dxv-return-policy__shell {
    width: min(100% - 32px, 1240px);
  }

  .dxv-return-policy__layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .dxv-return-policy__hero {
    padding-bottom: 40px;
  }

  .dxv-return-policy__hero h1 {
    font-size: clamp(2.5rem, 11.6vw, 3.45rem);
  }

  .dxv-return-policy__contents {
    min-width: 0;
    position: static;
  }

  .dxv-return-policy__contents > p {
    display: block;
    margin-bottom: 12px;
  }

  .dxv-return-policy__contents-rail {
    display: flex;
    width: calc(100% + 32px);
    overflow-x: auto;
    gap: 22px;
    margin: 0 0 0 -16px;
    border-top: 1px solid var(--return-line);
    border-bottom: 1px solid var(--return-line);
    overscroll-behavior-x: contain;
    padding: 0 16px;
    scroll-padding-inline: 16px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    user-select: none;
  }

  .dxv-return-policy__contents-rail::-webkit-scrollbar {
    display: none;
  }

  .dxv-return-policy__contents-rail a {
    position: relative;
    flex: 0 0 auto;
    width: auto;
    padding: 14px 0 12px;
    font-size: 0.8125rem;
    letter-spacing: 0.015em;
    line-height: 1.4;
    scroll-snap-align: start;
    text-decoration: none;
    white-space: nowrap;
  }

  .dxv-return-policy__contents-rail a::after {
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

  .dxv-return-policy__contents-rail a[aria-current='page']::after {
    width: auto;
    opacity: 1;
    transform: scaleX(1);
  }

  .dxv-return-policy__layout {
    gap: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dxv-return-policy *,
  .dxv-return-policy *::before,
  .dxv-return-policy *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
