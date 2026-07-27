<script setup lang="ts">
const panels = [
  {
    title: 'The Furnished Centerpiece',
    href: '/collections/bathroom-vanities',
    copy: 'Conceal the essentials with the grounded craftsmanship and artisanal integrity of a vanity serving as a convenient anchor in the bathroom sanctuary.',
    image: {
      desktop: 'https://maidstonedxv.com/cdn/shop/files/new-featured-products-vanity-desktop.jpg?format=webp&v=1773409568&width=2244',
      mobile: 'https://maidstonedxv.com/cdn/shop/files/new-featured-products-vanity-mobile.jpg?format=webp&v=1773409576&width=600',
      alt: 'Bathroom with wooden vanity, mirror, and decorative elements.'
    }
  }
]
</script>

<template>
  <section class="dxv-double-hero dxv-reveal" aria-label="Featured rooms">
    <a v-for="panel in panels" :key="panel.title" class="dxv-double-panel" :href="panel.href">
      <HomeResponsiveImage :image="panel.image" />
      <div class="dxv-double-copy">
        <h2>{{ panel.title }}</h2>
        <p>{{ panel.copy }}</p>
        <span>Discover more</span>
      </div>
    </a>
  </section>
</template>
