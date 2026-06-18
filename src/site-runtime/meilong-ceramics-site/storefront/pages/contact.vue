<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/contact`)

useSeoMeta({
  title: 'Contact Meilong Ceramics',
  description:
    'Contact Meilong Ceramics for project surface consultation, sample discussions, and B2B porcelain collection inquiries.',
  ogTitle: 'Contact Meilong Ceramics',
  ogDescription: 'Email or message the Meilong team for commercial porcelain surface discussions.',
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main class="site-shell">
    <SiteHeader />

    <section class="contact-layout">
      <div>
        <p class="eyebrow">Contact</p>
        <h1>Discuss samples, specifications, and commercial surface programs.</h1>
        <p class="lede">
          P1 contact actions are outbound only. This page does not submit inquiries, create CRM
          leads, open orders, or write any customer data into OES.
        </p>
      </div>
      <aside class="contact-panel">
        <a class="contact-row" href="mailto:sales@meilong-ceramics.com">
          <span>Email</span>
          <strong>sales@meilong-ceramics.com</strong>
        </a>
        <a class="contact-row" href="https://wa.me/8618927346174" rel="noopener noreferrer">
          <span>WhatsApp</span>
          <strong>Project consultation</strong>
        </a>
        <div class="contact-row">
          <span>Response focus</span>
          <strong>Samples, specifications, distributor programs</strong>
        </div>
      </aside>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">Before you write</p>
        <h2>Helpful project details</h2>
      </div>
      <div class="capability-strip">
        <div>
          <span>Application</span>
          <p>Interior floor, wall cladding, counter surface, outdoor terrace, or decor package.</p>
        </div>
        <div>
          <span>Format</span>
          <p>Approximate size, finish, thickness, slip-resistance needs, and sample deadline.</p>
        </div>
        <div>
          <span>Program</span>
          <p>Distribution, hospitality, retail, residential development, or design studio sourcing.</p>
        </div>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>
