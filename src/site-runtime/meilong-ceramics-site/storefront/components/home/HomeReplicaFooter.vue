<script setup lang="ts">
const aboutLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Catalogue', href: '/product/collections' },
  { label: 'ABG Rewards Program', href: '#' },
  { label: 'Become a Dealer', href: '#' }
]
const supportLinks = [
  { label: 'My Account', href: '#' },
  { label: 'FAQ', href: '/faqs' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Where to Buy', href: '#' },
  { label: 'Custom Paint Guide', href: '#' },
  { label: 'Tub Insulation Guide', href: '#' },
  { label: 'Partner Resources', href: '#' },
  { label: 'Shipping & Delivery', href: '/shipping-delivery' },
  { label: 'Returns & Refunds', href: '/returns-refunds' },
  { label: 'Warranty', href: '/warranty' }
]
const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'My Privacy Rights', href: '/privacy-policy#privacy-rights' },
  { label: 'Terms & Conditions', href: '/terms-conditions' },
  { label: 'Do Not Sell or Share My Personal Information', href: '/privacy-policy#do-not-sell' },
  { label: 'Cookie Settings', href: '#' }
]
const socialLinks = [
  {
    label: 'Instagram (opens in a new tab)',
    href: 'https://www.instagram.com/maidstonedxv',
    viewBox: '0 0 27 26',
    size: 40,
    paths: [
      'M19.1601 8.28975C19.1601 8.95075 18.6206 9.48721 17.956 9.48721C17.2902 9.48721 16.752 8.95075 16.752 8.28975C16.752 7.62875 17.2902 7.09229 17.956 7.09229C18.6206 7.09229 19.1601 7.62875 19.1601 8.28975Z',
      'M13.1392 3.5C10.524 3.5 10.1953 3.51078 9.16827 3.55748C8.14242 3.60418 7.44287 3.76584 6.83001 4.00293C6.19668 4.24722 5.65967 4.57532 5.12387 5.107C4.58807 5.63987 4.25937 6.17394 4.01254 6.805C3.77413 7.41451 3.61159 8.11023 3.56463 9.12927C3.51767 10.1519 3.50684 10.4788 3.50684 13.0797C3.50684 15.6818 3.51767 16.0075 3.56463 17.0289C3.61159 18.0492 3.77413 18.7449 4.01254 19.3556C4.25937 19.9855 4.58807 20.5195 5.12387 21.0512C5.65967 21.5841 6.19668 21.9122 6.83001 22.1565C7.44287 22.3936 8.14242 22.5552 9.16827 22.6019C10.1953 22.6486 10.524 22.6594 13.1392 22.6594C15.7544 22.6594 16.0843 22.6486 17.1102 22.6019C18.1372 22.5552 18.8368 22.3936 19.4496 22.1565C20.083 21.9122 20.62 21.5841 21.1558 21.0512C21.6904 20.5195 22.0191 19.9855 22.2671 19.3556C22.5043 18.7449 22.6681 18.0492 22.715 17.0289C22.762 16.0075 22.7716 15.6818 22.7716 13.0797C22.7716 10.4788 22.762 10.1519 22.715 9.12927C22.6681 8.11023 22.5043 7.41451 22.2671 6.805C22.0191 6.17394 21.6904 5.63987 21.1558 5.107C20.62 4.57532 20.083 4.24722 19.4496 4.00293C18.8368 3.76584 18.1372 3.60418 17.1102 3.55748C16.0843 3.51078 15.7544 3.5 13.1392 3.5ZM13.1392 5.22554C15.7111 5.22554 16.0157 5.23632 17.0319 5.28183C17.9711 5.32374 18.4816 5.4806 18.8199 5.61113C19.269 5.78476 19.5917 5.99312 19.9277 6.32841C20.2648 6.6637 20.4731 6.98222 20.6489 7.43007C20.7801 7.76776 20.9378 8.27429 20.98 9.20831C21.0257 10.219 21.0366 10.5219 21.0366 13.0797C21.0366 15.6375 21.0257 15.9404 20.98 16.9499C20.9378 17.8851 20.7801 18.3929 20.6489 18.7293C20.4731 19.176 20.2648 19.4957 19.9277 19.831C19.5917 20.1663 19.269 20.3735 18.8199 20.5483C18.4816 20.6788 17.9711 20.8357 17.0319 20.8776C16.0157 20.9243 15.7111 20.9339 13.1392 20.9339C10.5674 20.9339 10.2628 20.9243 9.24774 20.8776C8.30738 20.8357 7.79686 20.6788 7.45852 20.5483C7.00941 20.3735 6.68793 20.1663 6.3508 19.831C6.01487 19.4957 5.80536 19.176 5.63078 18.7293C5.49833 18.3929 5.34181 17.8851 5.29846 16.9499C5.25271 15.9404 5.24187 15.6375 5.24187 13.0797C5.24187 10.5219 5.25271 10.219 5.29846 9.20831C5.34181 8.27429 5.49833 7.76776 5.63078 7.43007C5.80536 6.98222 6.01487 6.6637 6.3508 6.32841C6.68793 5.99312 7.00941 5.78476 7.45852 5.61113C7.79686 5.4806 8.30738 5.32374 9.24774 5.28183C10.2628 5.23632 10.5674 5.22554 13.1392 5.22554Z',
      'M13.1394 16.1892C11.4128 16.1892 10.0137 14.7966 10.0137 13.0794C10.0137 11.3622 11.4128 9.97079 13.1394 9.97079C14.866 9.97079 16.2664 11.3622 16.2664 13.0794C16.2664 14.7966 14.866 16.1892 13.1394 16.1892ZM13.1394 8.28955C10.4797 8.28955 8.32324 10.4342 8.32324 13.0794C8.32324 15.7246 10.4797 17.8693 13.1394 17.8693C15.7992 17.8693 17.9556 15.7246 17.9556 13.0794C17.9556 10.4342 15.7992 8.28955 13.1394 8.28955Z'
    ]
  },
  {
    label: 'Facebook (opens in a new tab)',
    href: 'https://www.facebook.com/maidstoneIdxv',
    viewBox: '0 0 32 32',
    size: 32,
    paths: [
      'M12.965 28.212V16.56H9.333v-4.541h3.632v-3.35c0-3.885 2.197-6.001 5.407-6.001 1.537 0 2.86.123 3.245.178v4.062l-2.227.002c-1.746 0-2.083.895-2.083 2.21v2.899h4.162l-.542 4.541h-3.62v11.653h-4.342z'
    ]
  },
  {
    label: 'Pinterest (opens in a new tab)',
    href: 'https://pinterest.com/maidstonedxv',
    viewBox: '0 0 32 32',
    size: 32,
    paths: [
      'M5.333 12.455c0 2.369 1.302 5.323 3.39 6.263.317.142.484.081.556-.217.057-.223.34-1.322.465-1.834a.475.475 0 0 0-.116-.465c-.688-.809-1.24-2.3-1.24-3.689 0-3.567 2.79-7.018 7.54-7.018 4.104 0 6.976 2.708 6.976 6.58 0 4.374-2.28 7.406-5.249 7.406-1.641 0-2.868-1.312-2.475-2.924.472-1.922 1.384-3.996 1.384-5.383 0-1.243-.688-2.28-2.113-2.28-1.675 0-3.023 1.68-3.023 3.929 0 1.431.501 2.4.501 2.4s-1.654 6.779-1.957 8.04c-.516 2.139.067 5.61.118 5.912.028.162.213.217.32.081.161-.21 2.158-3.106 2.72-5.202.201-.758 1.038-3.845 1.038-3.845.547 1.007 2.136 1.858 3.83 1.858 5.036 0 8.669-4.488 8.669-10.059 0-5.344-4.505-9.341-10.3-9.341-7.208 0-11.034 4.684-11.034 9.788z'
    ]
  },
  {
    label: 'LinkedIn (opens in a new tab)',
    href: 'https://linkedin.com/company/maidstonedxv',
    viewBox: '0 0 31 31',
    size: 31,
    paths: [
      'M27.6726 0H2.75216C1.2322 0 0 1.2322 0 2.75216V27.6725C0 29.1925 1.2322 30.4247 2.75216 30.4247H27.6725C29.1925 30.4247 30.4247 29.1925 30.4247 27.6725V2.75216C30.4247 1.2322 29.1925 0 27.6726 0ZM9.4147 26.2707C9.4147 26.7131 9.05614 27.0716 8.61378 27.0716H5.20446C4.76211 27.0716 4.40354 26.7131 4.40354 26.2707V11.979C4.40354 11.5366 4.76211 11.1781 5.20446 11.1781H8.61378C9.05614 11.1781 9.4147 11.5366 9.4147 11.979V26.2707ZM6.90912 9.83085C5.12036 9.83085 3.67024 8.38074 3.67024 6.59197C3.67024 4.80321 5.12036 3.35309 6.90912 3.35309C8.69789 3.35309 10.148 4.80321 10.148 6.59197C10.148 8.38074 8.69797 9.83085 6.90912 9.83085ZM27.2317 26.3352C27.2317 26.7419 26.902 27.0716 26.4953 27.0716H22.8369C22.4302 27.0716 22.1005 26.7419 22.1005 26.3352V19.6316C22.1005 18.6316 22.3938 15.2494 19.487 15.2494C17.2323 15.2494 16.775 17.5644 16.6832 18.6033V26.3352C16.6832 26.7419 16.3535 27.0716 15.9468 27.0716H12.4084C12.0018 27.0716 11.672 26.7419 11.672 26.3352V11.9145C11.672 11.5078 12.0018 11.1781 12.4084 11.1781H15.9468C16.3535 11.1781 16.6832 11.5078 16.6832 11.9145V13.1613C17.5192 11.9067 18.7617 10.9383 21.4071 10.9383C27.2653 10.9383 27.2317 16.4112 27.2317 19.4183V26.3352Z'
    ]
  },
  {
    label: 'TikTok (opens in a new tab)',
    href: 'https://www.tiktok.com/@maidstonedxv',
    viewBox: '0 0 24 24',
    size: 32,
    paths: [
      'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z'
    ]
  }
]
const logoSrc = 'https://maidstonedxv.com/cdn/shop/files/logo.svg?v=1769442310'
const openMobileSection = ref<'about' | 'support' | null>(null)
const isNewsletterSubmitted = ref(false)
let newsletterSubmitTimer: ReturnType<typeof setTimeout> | undefined
const { openAccountDialog } = useAccountDialog()

// Toggles the mobile-only footer accordion while desktop footer columns stay expanded.
const toggleMobileSection = (section: 'about' | 'support') => {
  openMobileSection.value = openMobileSection.value === section ? null : section
}

// Routes only the existing My Account support link to the shared account dialog.
const handleSupportLink = (link: { label: string }, event: MouseEvent) => {
  if (link.label !== 'My Account') {
    return
  }

  event.preventDefault()
  openAccountDialog()
}

// Shows a short newsletter submit acknowledgement without changing the footer layout.
const handleNewsletterSubmit = () => {
  isNewsletterSubmitted.value = true
  if (newsletterSubmitTimer) {
    clearTimeout(newsletterSubmitTimer)
  }
  newsletterSubmitTimer = setTimeout(() => {
    isNewsletterSubmitted.value = false
  }, 1800)
}

onBeforeUnmount(() => {
  if (newsletterSubmitTimer) {
    clearTimeout(newsletterSubmitTimer)
  }
})
</script>

<template>
  <footer class="dxv-footer dxv-reveal">
    <div class="dxv-footer-grid">
      <section class="dxv-footer-newsletter" aria-label="Newsletter signup">
        <h3>Sign up for our newsletter</h3>
        <form
          class="dxv-footer-form"
          :class="{ 'is-submitted': isNewsletterSubmitted }"
          @submit.prevent="handleNewsletterSubmit"
        >
          <label for="dxv-footer-email">Email</label>
          <div>
            <input id="dxv-footer-email" type="email" placeholder="Email">
            <button type="submit" :aria-label="isNewsletterSubmitted ? 'Newsletter submitted' : 'Submit newsletter signup'">
              <span>{{ isNewsletterSubmitted ? 'Sent' : 'Submit' }}</span>
            </button>
          </div>
        </form>
      </section>

      <nav
        class="dxv-footer-column dxv-footer-about"
        :class="{ 'mobile-open': openMobileSection === 'about' }"
        aria-label="About Maidstone DXV"
      >
        <button
          class="dxv-footer-heading-button"
          type="button"
          :aria-expanded="openMobileSection === 'about'"
          @click="toggleMobileSection('about')"
        >
          <span>About Maidstone | DXV</span>
          <span class="dxv-footer-plus" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
        <div class="dxv-footer-links">
          <a v-for="link in aboutLinks" :key="link.label" :href="link.href">{{ link.label }}</a>
        </div>
        <p class="dxv-footer-contact">
          Phone: <a href="tel:8885130060">888-513-0060</a><br>
          Hours: Mon - Fri 8:30 AM to 5 PM EST
        </p>
      </nav>

      <nav
        class="dxv-footer-column dxv-footer-support"
        :class="{ 'mobile-open': openMobileSection === 'support' }"
        aria-label="Help and support"
      >
        <button
          class="dxv-footer-heading-button"
          type="button"
          :aria-expanded="openMobileSection === 'support'"
          @click="toggleMobileSection('support')"
        >
          <span>Help &amp; Support</span>
          <span class="dxv-footer-plus" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
        <div class="dxv-footer-links dxv-footer-support-links">
          <a v-for="link in supportLinks" :key="link.label" :href="link.href" @click="handleSupportLink(link, $event)">{{ link.label }}</a>
        </div>
      </nav>

      <section class="dxv-footer-social" aria-label="Social links">
        <h3>Follow Us</h3>
        <div class="dxv-footer-social-icons" aria-label="Social media">
          <a
            v-for="link in socialLinks"
            :key="link.label"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="link.label"
          >
            <span class="dxv-footer-social-icon" :style="{ width: `${link.size}px`, height: `${link.size}px` }">
              <svg :viewBox="link.viewBox" aria-hidden="true">
              <path
                v-for="path in link.paths"
                :key="path"
                :d="path"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              />
            </svg>
            </span>
          </a>
        </div>
      </section>
    </div>

    <div class="dxv-footer-bottom">
      <div class="dxv-footer-brand">
        <img :src="logoSrc" alt="MAIDSTONE | DXV">
      </div>
      <nav aria-label="Legal links">
        <a v-for="link in legalLinks" :key="link.label" :href="link.href">{{ link.label }}</a>
      </nav>
      <p class="dxv-footer-copyright">
        &copy;2026 <a href="/">MAIDSTONE | DXV</a> All rights reserved.
      </p>
    </div>
  </footer>
</template>
