<script setup lang="ts">
const shippingSections = [
  { id: 'delivery-coverage', label: 'Where we deliver' },
  { id: 'delivery-methods', label: 'Shipping methods' },
  { id: 'freight-deliveries', label: 'Freight deliveries' },
  { id: 'delivery-inspection', label: 'Inspect your delivery' },
  { id: 'delivery-delays', label: 'Delivery delays' },
  { id: 'order-support', label: 'Order support' }
]
const activeSectionId = ref<string | null>(null)

// jumpToSection selects a shipping table-of-contents link, scrolls to its section, and preserves a shareable hash.
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

// syncActiveSectionFromHash keeps the shipping table of contents in sync with direct and shared anchor links.
function syncActiveSectionFromHash(): void {
  if (!import.meta.client) {
    return
  }

  const sectionId = window.location.hash.slice(1)
  activeSectionId.value = shippingSections.some((section) => section.id === sectionId) ? sectionId : null
}

onMounted(() => {
  syncActiveSectionFromHash()
  window.addEventListener('hashchange', syncActiveSectionFromHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncActiveSectionFromHash)
})

useSeoMeta({
  title: 'Shipping & Delivery | MAIDSTONE | DXV',
  description: 'Delivery coverage, parcel and freight guidance, inspection requirements, and order support for MAIDSTONE | DXV purchases.',
  ogTitle: 'Shipping & Delivery | MAIDSTONE | DXV',
  ogDescription: 'Clear delivery guidance for parcel and freight orders.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <main class="dxv-shipping-policy" aria-labelledby="shipping-policy-title">
    <header class="dxv-shipping-policy__hero">
      <div class="dxv-shipping-policy__shell">
        <p class="dxv-shipping-policy__eyebrow">Customer care</p>
        <h1 id="shipping-policy-title">Shipping &amp; Delivery</h1>
        <p class="dxv-shipping-policy__intro">
          Clear guidance for every order—from standard parcel service to scheduled freight delivery—so you can plan with confidence before installation begins.
        </p>
        <p class="dxv-shipping-policy__updated">Last updated July 19, 2026</p>
      </div>
    </header>

    <div class="dxv-shipping-policy__shell dxv-shipping-policy__layout">
      <aside class="dxv-shipping-policy__contents" aria-label="On this page">
        <p>On this page</p>
        <nav class="dxv-shipping-policy__contents-rail">
          <a
            v-for="section in shippingSections"
            :key="section.id"
            :href="`#${section.id}`"
            :aria-current="activeSectionId === section.id ? 'page' : undefined"
            @click.prevent="jumpToSection(section.id)"
          >
            {{ section.label }}
          </a>
        </nav>
      </aside>

      <div class="dxv-shipping-policy__content">
        <section id="delivery-coverage" class="dxv-shipping-policy__section" aria-labelledby="delivery-coverage-title">
          <p class="dxv-shipping-policy__section-index">01 / Delivery coverage</p>
          <h2 id="delivery-coverage-title">Where we deliver</h2>
          <p>
            Complimentary standard shipping applies to qualifying orders delivered within the contiguous 48 United States. When required for the product, this includes protective crating, freight handling, and residential or lift-gate support.
          </p>
          <p>
            Delivery to Alaska, Hawaii, the Florida Keys, islands, Canada, and other non-standard destinations may require additional charges or have service restrictions. Please contact Customer Care before placing an order when delivery is outside the contiguous United States.
          </p>
        </section>

        <section id="delivery-methods" class="dxv-shipping-policy__section" aria-labelledby="delivery-methods-title">
          <p class="dxv-shipping-policy__section-index">02 / Shipping methods</p>
          <h2 id="delivery-methods-title">Parcel and freight are planned differently</h2>
          <p>
            <strong>Parcel delivery.</strong> Smaller items may ship through parcel carriers, including FedEx, UPS, or USPS. Carrier service and tracking details are assigned once the shipment is released.
          </p>
          <p>
            <strong>Freight delivery.</strong> Large, heavy, or crated items may travel by common carrier freight. Freight service is coordinated around the shipment and destination rather than a standard parcel route.
          </p>
          <p>
            Product availability, destination, and carrier capacity can affect dispatch and transit planning. Do not schedule installation until the complete order has arrived and has been inspected.
          </p>
        </section>

        <section id="freight-deliveries" class="dxv-shipping-policy__section" aria-labelledby="freight-deliveries-title">
          <p class="dxv-shipping-policy__section-index">03 / Freight deliveries</p>
          <h2 id="freight-deliveries-title">Plan the handoff before the truck arrives</h2>
          <ul class="dxv-shipping-policy__checklist">
            <li>Provide an accurate delivery address and a reachable daytime contact when you place the order.</li>
            <li>Confirm site access, delivery hours, and any building, gate, or receiving requirements before dispatch.</li>
            <li>Arrange enough help to move the product beyond the delivery point if your project requires it.</li>
            <li>Keep the original packaging until the product has been inspected and you are ready to install.</li>
          </ul>
        </section>

        <section id="delivery-inspection" class="dxv-shipping-policy__section" aria-labelledby="delivery-inspection-title">
          <p class="dxv-shipping-policy__section-index">04 / Delivery inspection</p>
          <h2 id="delivery-inspection-title">Inspect your delivery before installation</h2>
          <p>
            Inspect cartons, crates, and visible product surfaces as soon as your order arrives. Note visible damage or shortages on the delivery paperwork when possible, retain all packaging, and take clear photos of the product, packaging, and shipping label.
          </p>
          <p>
            Claims for shortage, loss, damage, or missing parts must be reported to Customer Care within 48 hours of receipt. Damage or parts claims made after this period may be rejected by the freight carrier.
          </p>
        </section>

        <section id="delivery-delays" class="dxv-shipping-policy__section" aria-labelledby="delivery-delays-title">
          <p class="dxv-shipping-policy__section-index">05 / Delivery changes</p>
          <h2 id="delivery-delays-title">Delivery delays and order changes</h2>
          <p>
            Carrier disruptions, weather, freight capacity, and destination access can affect delivery plans. If a delivery date no longer works for your project, contact Customer Care promptly with your order number so we can confirm the available options before the shipment is in transit.
          </p>
          <p>
            Changes to an address, delivery instructions, or an order may be limited after an order has entered fulfillment or has been tendered to a carrier. Any available delivery charges or restrictions will be confirmed before a change is completed.
          </p>
        </section>

        <section id="order-support" class="dxv-shipping-policy__support" aria-labelledby="order-support-title">
          <p class="dxv-shipping-policy__section-index">06 / Order support</p>
          <h2 id="order-support-title">Need help with a shipment?</h2>
          <p>
            Have your order number, delivery postal code, and any relevant photos ready. Our Customer Care team can help route questions about tracking, delivery access, freight damage, or missing parts.
          </p>
          <NuxtLink to="/contact">Contact Customer Care <span aria-hidden="true">→</span></NuxtLink>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dxv-shipping-policy {
  --shipping-ink: #252525;
  --shipping-muted: #686862;
  --shipping-line: #d7d5ce;
  --shipping-paper: #ffffff;
  --shipping-accent: #3c4a46;
  min-height: 100dvh;
  overflow: clip;
  padding: 167px 0 128px;
  background: #fff;
  color: var(--shipping-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
}

.dxv-shipping-policy__shell {
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

.dxv-shipping-policy__hero {
  border-bottom: 1px solid var(--shipping-line);
  background: var(--shipping-paper);
  padding-bottom: 72px;
}

.dxv-shipping-policy__eyebrow,
.dxv-shipping-policy__section-index,
.dxv-shipping-policy__contents > p,
.dxv-shipping-policy__updated {
  margin: 0;
  color: var(--shipping-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.35;
  text-transform: uppercase;
}

.dxv-shipping-policy__content h2,
.dxv-shipping-policy__support h2 {
  margin: 0;
  color: var(--shipping-ink);
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 500;
  letter-spacing: -0.035em;
}

.dxv-shipping-policy__hero h1 {
  max-width: 760px;
  margin: 18px 0 0;
  color: var(--shipping-ink);
  font-family: var(--dxv-body, "Avenir Next", Arial, sans-serif);
  font-size: clamp(2.7rem, 4.35vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
}

.dxv-shipping-policy__intro {
  max-width: 530px;
  margin: 24px 0 0;
  color: var(--shipping-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.dxv-shipping-policy__updated {
  margin-top: 24px;
}

.dxv-shipping-policy__layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: clamp(48px, 8vw, 128px);
  padding-top: 58px;
}

.dxv-shipping-policy__contents {
  align-self: start;
  position: sticky;
  top: 110px;
}

.dxv-shipping-policy__contents-rail {
  display: grid;
  gap: 13px;
  margin-top: 20px;
}

.dxv-shipping-policy__contents-rail a {
  width: fit-content;
  color: var(--shipping-ink);
  font-size: 0.9rem;
  line-height: 1.4;
  text-decoration: none;
}

.dxv-shipping-policy__contents-rail a::after,
.dxv-shipping-policy__support a::after {
  display: block;
  width: 0;
  height: 1px;
  margin-top: 3px;
  background: currentColor;
  content: "";
  transition: width 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-shipping-policy__contents-rail a:hover::after,
.dxv-shipping-policy__contents-rail a:focus-visible::after,
.dxv-shipping-policy__contents-rail a[aria-current='page']::after,
.dxv-shipping-policy__support a:hover::after,
.dxv-shipping-policy__support a:focus-visible::after {
  width: 100%;
}

.dxv-shipping-policy__content {
  min-width: 0;
}

.dxv-shipping-policy__section,
.dxv-shipping-policy__support {
  border-top: 1px solid var(--shipping-line);
  padding: 34px 0 52px;
}

.dxv-shipping-policy__content > :first-child {
  border-top: 0;
  padding-top: 0;
}

.dxv-shipping-policy__content h2,
.dxv-shipping-policy__support h2 {
  max-width: 15ch;
  margin-top: 16px;
  font-size: clamp(2.15rem, 4vw, 3.75rem);
  line-height: 0.98;
}

.dxv-shipping-policy__section > p:not(.dxv-shipping-policy__section-index),
.dxv-shipping-policy__support > p:not(.dxv-shipping-policy__section-index) {
  max-width: 68ch;
  margin: 24px 0 0;
  color: #4f4f4b;
  font-size: 1rem;
  line-height: 1.75;
}

.dxv-shipping-policy__checklist {
  display: grid;
  gap: 14px;
  max-width: 66ch;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.dxv-shipping-policy__checklist li {
  position: relative;
  padding-left: 28px;
  color: #4f4f4b;
  font-size: 1rem;
  line-height: 1.65;
}

.dxv-shipping-policy__checklist li::before {
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 12px;
  height: 1px;
  background: var(--shipping-accent);
  content: "";
}

.dxv-shipping-policy__support {
  border-bottom: 1px solid var(--shipping-line);
}

.dxv-shipping-policy__support a {
  display: inline-flex;
  width: fit-content;
  margin-top: 30px;
  color: var(--shipping-ink);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-decoration: none;
  text-transform: uppercase;
}

.dxv-shipping-policy__support a span {
  margin-left: 12px;
  font-size: 1rem;
}

@media (max-width: 800px) {
  .dxv-shipping-policy {
    padding: 96px 0 72px;
  }

  .dxv-shipping-policy__shell {
    width: min(100% - 32px, 1240px);
  }

  .dxv-shipping-policy__layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .dxv-shipping-policy__hero {
    padding-bottom: 40px;
  }

  .dxv-shipping-policy__hero h1 {
    font-size: clamp(2.5rem, 11.6vw, 3.45rem);
  }

  .dxv-shipping-policy__contents {
    min-width: 0;
    position: static;
  }

  .dxv-shipping-policy__contents > p {
    display: block;
    margin-bottom: 12px;
  }

  .dxv-shipping-policy__contents-rail {
    display: flex;
    width: calc(100% + 32px);
    overflow-x: auto;
    gap: 22px;
    margin: 0 0 0 -16px;
    border-top: 1px solid var(--shipping-line);
    border-bottom: 1px solid var(--shipping-line);
    overscroll-behavior-x: contain;
    padding: 0 16px;
    scroll-padding-inline: 16px;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    user-select: none;
  }

  .dxv-shipping-policy__contents-rail::-webkit-scrollbar {
    display: none;
  }

  .dxv-shipping-policy__contents-rail a {
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

  .dxv-shipping-policy__contents-rail a::after {
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

  .dxv-shipping-policy__contents-rail a[aria-current='page']::after {
    width: auto;
    opacity: 1;
    transform: scaleX(1);
  }

  .dxv-shipping-policy__layout {
    gap: 48px;
  }

}
</style>
