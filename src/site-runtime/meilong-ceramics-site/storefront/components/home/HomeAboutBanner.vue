<script setup lang="ts">
// Supplies the approved Swiss Madison reference video and poster for the homepage test banner.
const media = {
  video:
    'https://cdn.shopify.com/videos/c/vp/65be6ef608e14bb38a06ed61e1ebdacf/65be6ef608e14bb38a06ed61e1ebdacf.HD-1080p-7.2Mbps-66159988.mp4',
  poster:
    'https://cdn.shopify.com/s/files/1/1585/4485/files/preview_images/65be6ef608e14bb38a06ed61e1ebdacf.thumbnail.0000000000_1920x.jpg?v=1767203403'
}
</script>

<template>
  <section class="dxv-about-banner dxv-reveal" aria-label="About Swiss Madison">
    <video
      class="dxv-about-banner__media"
      aria-hidden="true"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      :poster="media.poster"
    >
      <source :src="media.video" type="video/mp4" />
    </video>
    <div class="dxv-about-banner__content">
      <h2>Well made, forever.</h2>
      <p class="dxv-about-banner__lede">
        Born in Brooklyn, NY, we saw a world of uninspired bathrooms, so we reimagined what they
        could be.
      </p>
      <a class="dxv-about-banner__link" href="/about">
        <span>Discover Swiss Madison</span>
      </a>
    </div>
  </section>
</template>
