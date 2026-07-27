<script setup lang="ts">
const reasonOptions = [
  'General Inquiry',
  'Product Information',
  'Order Status',
  'Returns & Refunds',
  'Feedback',
  'Other'
]

// Keeps the replicated contact form visual-only until the backend contact contract is frozen.
function handleContactSubmit() {
  return false
}

useSeoMeta({
  title: 'Contact Maidstone DXV for Product Support & Design Assistance',
  description:
    'Contact Maidstone DXV for product questions, design guidance, customer service support, and information about luxury bathtubs, sinks, vanities, and bathroom fixtures.',
  ogTitle: 'Contact Maidstone DXV for Product Support & Design Assistance',
  ogDescription:
    'Contact Maidstone DXV for product questions, design guidance, customer service support, and information about luxury bathtubs, sinks, vanities, and bathroom fixtures.',
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
      href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Book.woff2?v=1771863016'
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
      href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Medium.woff2?v=1771863004'
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
      href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Didot-regular.woff2?v=1771863042'
    }
  ]
})
</script>

<template>
  <main class="dxv-contact-page">
    <section class="dxv-contact-section dxv-reveal" aria-labelledby="dxv-contact-title">
      <div class="dxv-contact-container">
        <div class="dxv-contact-left">
          <nav class="dxv-contact-breadcrumbs" role="navigation" aria-label="breadcrumbs">
            <NuxtLink class="dxv-contact-breadcrumb-home" to="/" aria-label="home">Home</NuxtLink>
            <span class="dxv-contact-breadcrumb-dot" aria-hidden="true" />
            <span class="dxv-contact-breadcrumb-current" aria-current="page">Contact</span>
          </nav>

          <div class="dxv-contact-content">
            <div class="dxv-contact-intro">
              <h1 id="dxv-contact-title">Contact Us</h1>
              <div class="dxv-contact-lede">
                <p>
                  To ensure the seamless specification of the MAIDSTONE | DXV portfolio, dedicated liaisons are
                  available to provide technical clarity and curatorial assistance.
                </p>
                <p>
                  Correspondence may be initiated via telephone, direct email, or the provided digital form below.
                </p>
              </div>
              <p class="dxv-contact-note">
                <span aria-hidden="true">*</span>All inquiries receive a comprehensive response within 48 hours.
              </p>
            </div>

            <div class="dxv-contact-mobile-image" aria-hidden="true">
              <picture>
                <source
                  media="(max-width: 768px)"
                  srcset="
                    https://maidstonedxv.com/cdn/shop/files/contact-us-mobile.jpg?format=webp&v=1772569476&width=400 400w,
                    https://maidstonedxv.com/cdn/shop/files/contact-us-mobile.jpg?format=webp&v=1772569476&width=600 600w
                  "
                  sizes="100vw"
                >
                <img
                  src="https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?crop=center&v=1772569466&width=1848"
                  alt=""
                  loading="lazy"
                >
              </picture>
            </div>

            <div class="dxv-contact-panels">
              <section class="dxv-contact-panel" aria-labelledby="dxv-contact-customer-service">
                <h2 id="dxv-contact-customer-service">Customer Service</h2>
                <p class="dxv-contact-line dxv-contact-phone">
                  <span class="dxv-contact-icon dxv-contact-icon-phone" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 32 32">
                      <path
                        d="M15.802 16.854a22.334 22.334 0 0 0 3.255 2.728.858.858 0 0 0 1.175-.363l.313-.612c.236-.393.616-.68 1.056-.8a1.7 1.7 0 0 1 1.294.16l1.945 1.207c.239.149.405.39.455.667.247 1.349.23 1.65-.73 2.61-2.375 2.374-7.558 1.061-11.66-3.041C8.8 15.307 7.487 10.124 9.862 7.75c.956-.957 1.186-.907 2.573-.714.297.04.562.211.721.466l1.19 1.917c.115.19.19.404.22.627.03.223.015.45-.045.67a1.736 1.736 0 0 1-.815 1.053l-.612.312a.858.858 0 0 0-.363 1.176 32.542 32.542 0 0 0 3.07 3.597z"
                        stroke="currentColor"
                        stroke-miterlimit="10"
                      />
                    </svg>
                  </span>
                  <span class="dxv-contact-stack">
                    <a href="tel:888-513-0060">888-513-0060</a>
                    <span>Phone Hours: Mon - Fri 8:30 AM to 5 PM EST</span>
                  </span>
                </p>
                <p class="dxv-contact-line dxv-contact-email">
                  <span class="dxv-contact-icon dxv-contact-icon-mail" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 32 32">
                      <rect x="3.5" y="8.5" width="25" height="15" rx="1.5" stroke="currentColor" />
                      <path d="M3.5 8.5l10.57 8.88a3 3 0 0 0 3.86 0L28.5 8.5M3.5 23.5l7-6M28.5 23L22 17.5" stroke="currentColor" />
                    </svg>
                  </span>
                  <a href="mailto:customerservice@maidstonedxv.com">customerservice@maidstonedxv.com</a>
                </p>
              </section>

              <section class="dxv-contact-panel" aria-labelledby="dxv-contact-sales">
                <h2 id="dxv-contact-sales">Sales</h2>
                <p class="dxv-contact-line dxv-contact-phone">
                  <span class="dxv-contact-icon dxv-contact-icon-phone" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 32 32">
                      <path
                        d="M15.802 16.854a22.334 22.334 0 0 0 3.255 2.728.858.858 0 0 0 1.175-.363l.313-.612c.236-.393.616-.68 1.056-.8a1.7 1.7 0 0 1 1.294.16l1.945 1.207c.239.149.405.39.455.667.247 1.349.23 1.65-.73 2.61-2.375 2.374-7.558 1.061-11.66-3.041C8.8 15.307 7.487 10.124 9.862 7.75c.956-.957 1.186-.907 2.573-.714.297.04.562.211.721.466l1.19 1.917c.115.19.19.404.22.627.03.223.015.45-.045.67a1.736 1.736 0 0 1-.815 1.053l-.612.312a.858.858 0 0 0-.363 1.176 32.542 32.542 0 0 0 3.07 3.597z"
                        stroke="currentColor"
                        stroke-miterlimit="10"
                      />
                    </svg>
                  </span>
                  <span class="dxv-contact-stack">
                    <a href="tel:888-513-0060">888-513-0060</a>
                    <span>Phone Hours: Mon - Fri 8:30 AM to 5 PM EST</span>
                  </span>
                </p>
                <p class="dxv-contact-line dxv-contact-email">
                  <span class="dxv-contact-icon dxv-contact-icon-mail" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 32 32">
                      <rect x="3.5" y="8.5" width="25" height="15" rx="1.5" stroke="currentColor" />
                      <path d="M3.5 8.5l10.57 8.88a3 3 0 0 0 3.86 0L28.5 8.5M3.5 23.5l7-6M28.5 23L22 17.5" stroke="currentColor" />
                    </svg>
                  </span>
                  <a href="mailto:sales@maidstonedxv.com">sales@maidstonedxv.com</a>
                </p>
              </section>

              <section class="dxv-contact-panel" aria-labelledby="dxv-contact-address">
                <h2 id="dxv-contact-address">Contact Address</h2>
                <p class="dxv-contact-line dxv-contact-address">
                  <span class="dxv-contact-icon dxv-contact-icon-house" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11.9194.004C11.8414.017 11.7671.047 11.7014.091L.2616 7.346A.558.558 0 0 0 0 7.817V23.442c0 .148.0588.29.1635.3946A.558.558 0 0 0 .558 24h22.8797a.558.558 0 0 0 .558-.558V7.817a.558.558 0 0 0-.2616-.471L12.2943.091a.558.558 0 0 0-.3749-.087ZM11.9979 1.225 22.8797 8.122V22.884h-4.4643V15.0714a.558.558 0 0 0-.5581-.5581H6.1385a.558.558 0 0 0-.5581.5581V22.884H1.1161V8.122l10.8818-6.897ZM6.6965 15.6294h10.6028v1.6741H6.6965v-1.6741Zm0 2.7902h10.6028v1.6741H6.6965v-1.6741Zm0 2.7902h10.6028v1.6741H6.6965v-1.6741Z" fill="currentColor" />
                    </svg>
                  </span>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=395+Oak+Hill+Road%2C+Mountain+Top%2C+PA+18707"
                    target="_blank"
                    rel="noopener"
                  >
                    395 Oak Hill Road, Mountain Top,<br>PA 18707<br>USA
                  </a>
                </p>
              </section>

              <section class="dxv-contact-panel dxv-contact-faq" aria-labelledby="dxv-contact-faq">
                <h2 id="dxv-contact-faq">FAQs</h2>
                <p class="dxv-contact-line">
                  <span class="dxv-contact-icon dxv-contact-icon-faq" aria-hidden="true">
                    <svg viewBox="0 0 26 26" fill="none">
                      <path d="M12.8719 0C4.028.35 0 6.971 0 12.975c.0677 16.432 24.8482 17.959 25.8782.001C25.8728 9.53 24.4995 6.228 22.06 3.794 19.6215 1.361 16.3167-.003 12.8719 0Zm.0699 24.2045C5.2494 23.8995 1.7469 18.1702 1.748 12.975 1.8234-1.246 23.2378-2.5543 24.1302 12.9761c-.0022 2.9718-1.1799 5.8214-3.2765 7.9252-2.0976 2.1051-4.9414 3.2923-7.9119 3.3032Zm4.5854-14.9817c.1409.9399-.0109 1.8996-.437 2.7478-.4261.8492-1.1045 1.5454-1.9414 1.9925-1.1483.611-1.4607 2.0712-1.37 3.2332.0295.4765-.3278.8897-.8041.9279-.4763.0372-.8948-.3159-.9396-.7913-.1343-1.7127.3977-3.9053 2.2965-4.9162h.0011c.9221-.5104 1.5-1.4777 1.5131-2.5325.0142-1.0547-.5386-2.0363-1.4465-2.5707-.909-.5356-2.0342-.5421-2.9498-.0186-.9155.5246-1.4793 1.4985-1.4782 2.5532 0 .2328-.0929.4547-.2567.6187-.1639.1639-.3857.2557-.6173.2557-2.0069-.2284-.1715-3.9391.8915-4.5404 2.6767-2.245 7.2226-.5585 7.5384 3.0407ZM12.9068 20.79c-.4709-.0164-.8445-.4033-.8445-.8744s.3736-.858.8445-.8744c.4709.0164.8445.4033.8445.8744s-.3736.858-.8445.8744Z" fill="currentColor" />
                    </svg>
                  </span>
                  <span>
                    For immediate clarity on the MAIDSTONE | DXV portfolio, consult the curated archive of
                    <NuxtLink to="/faqs">frequently asked questions</NuxtLink>. This comprehensive reference addresses
                    common technical, aesthetic, and logistical particulars.
                  </span>
                </p>
              </section>
            </div>

            <div class="dxv-contact-direct">
              <h2>Direct Correspondence</h2>
              <p>
                Contact form inquiries are addressed with personalized attention within two business days. For
                immediate assistance, please contact the dedicated support line at
                <a href="tel:1-888-513-0060">1-888-513-0060</a>.
              </p>
            </div>

            <form id="ContactFormNative" class="dxv-contact-form" @submit.prevent="handleContactSubmit">
              <div class="dxv-contact-field">
                <label for="ContactFormReason">The reason for your inquiry <span>*</span></label>
                <select id="ContactFormReason" name="contact[Reason]" required>
                  <option value="">Choose a reason</option>
                  <option v-for="reason in reasonOptions" :key="reason" :value="reason">{{ reason }}</option>
                </select>
              </div>

              <div class="dxv-contact-field">
                <label for="ContactFormEmail">Email <span>*</span></label>
                <input id="ContactFormEmail" required type="email" name="contact[email]" placeholder="Email*" autocomplete="email">
              </div>

              <div class="dxv-contact-name-row">
                <div class="dxv-contact-field">
                  <label for="ContactFormFirstName">First Name <span>*</span></label>
                  <input
                    id="ContactFormFirstName"
                    required
                    type="text"
                    name="contact[First Name]"
                    placeholder="First Name*"
                    autocomplete="given-name"
                  >
                </div>
                <div class="dxv-contact-field">
                  <label for="ContactFormLastName">Last Name <span>*</span></label>
                  <input
                    id="ContactFormLastName"
                    required
                    type="text"
                    name="contact[Last Name]"
                    placeholder="Last Name*"
                    autocomplete="family-name"
                  >
                </div>
              </div>

              <div class="dxv-contact-field">
                <label for="ContactFormPhone">Phone number (Optional)</label>
                <input
                  id="ContactFormPhone"
                  type="tel"
                  name="contact[Phone number (Optional)]"
                  placeholder="Phone number (Optional)"
                  autocomplete="tel"
                >
              </div>

              <div class="dxv-contact-field">
                <label for="ContactFormMessage">Message <span>*</span></label>
                <textarea
                  id="ContactFormMessage"
                  required
                  name="contact[body]"
                  placeholder="Inquiry Message*"
                  rows="10"
                  maxlength="2000"
                />
              </div>

              <button class="dxv-contact-submit" type="submit">Send Inquiry</button>
            </form>
          </div>
        </div>

        <aside class="dxv-contact-image" aria-label="Copper bathtub in a bathroom with large window and wall sconces">
          <div class="dxv-contact-sticky">
            <picture>
              <source
                media="(max-width: 768px)"
                srcset="
                  https://maidstonedxv.com/cdn/shop/files/contact-us-mobile.jpg?format=webp&v=1772569476&width=400 400w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-mobile.jpg?format=webp&v=1772569476&width=600 600w
                "
                sizes="100vw"
              >
              <img
                src="https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?crop=center&v=1772569466&width=1848"
                alt="Copper bathtub in a bathroom with large window and wall sconces"
                width="1848"
                height="1386"
                loading="lazy"
                srcset="
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=400 400w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=600 600w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=800 800w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=1000 1000w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=1200 1200w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=1600 1600w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=2000 2000w,
                  https://maidstonedxv.com/cdn/shop/files/contact-us-desktop.jpg?format=webp&v=1772569466&width=2400 2400w
                "
                sizes="100vw"
              >
            </picture>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<style>
@font-face {
  font-family: "Gotham";
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Book.woff2?v=1771863016") format("woff2");
  font-style: normal;
  font-weight: 300 400;
  font-display: swap;
}

@font-face {
  font-family: "Gotham";
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Medium.woff2?v=1771863004") format("woff2");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}

@font-face {
  font-family: "Didot";
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Didot-regular.woff2?v=1771863042") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

body:has(.dxv-contact-page) {
  margin: 0;
  background: #ffffff;
  color: #000000;
  font-family: "Gotham", "Avenir Next", Arial, sans-serif;
}

.dxv-contact-page {
  min-height: 100dvh;
  padding-top: 66px;
  background: #ffffff;
  color: #000000;
  font-family: "Gotham", "Avenir Next", Arial, sans-serif;
  font-size: 15px;
  font-weight: 300;
  line-height: 1.5;
}

.dxv-contact-section {
  width: 100%;
}

.dxv-contact-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding-inline: 16px;
}

.dxv-contact-left {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
  padding-top: 30px;
}

.dxv-contact-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  padding-block: 16px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
}

.dxv-contact-breadcrumb-home {
  color: #6b7280;
  text-decoration: none;
  transition: color 180ms ease;
}

.dxv-contact-breadcrumb-home:hover {
  color: #374151;
}

.dxv-contact-breadcrumb-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-inline: 6px;
  border-radius: 999px;
  background: #9ca3af;
}

.dxv-contact-breadcrumb-current {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  color: #4b5563;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dxv-contact-content {
  width: 100%;
}

.dxv-contact-intro {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dxv-contact-intro h1 {
  margin: 0;
  color: #000000;
  font-family: "Didot", Georgia, serif;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: -1.08px;
  line-height: 1.2;
}

.dxv-contact-lede {
  display: flex;
  flex-direction: column;
  gap: 0;
  color: #000000;
  font-size: 18px;
  font-weight: 300;
  line-height: 1.5;
}

.dxv-contact-lede p,
.dxv-contact-note,
.dxv-contact-line,
.dxv-contact-direct p {
  margin: 0;
}

.dxv-contact-lede p:first-child {
  margin-bottom: 32px;
}

.dxv-contact-lede p:last-child {
  margin-bottom: 8px;
}

.dxv-contact-note {
  color: #000000;
  font-size: 14px;
  line-height: 20px;
}

.dxv-contact-note span,
.dxv-contact-field label span {
  color: #a60505;
}

.dxv-contact-mobile-image {
  display: block;
  padding-top: 32px;
}

.dxv-contact-mobile-image picture,
.dxv-contact-image picture {
  display: block;
  width: 100%;
}

.dxv-contact-mobile-image img,
.dxv-contact-image img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.dxv-contact-panels {
  margin-top: 40px;
  border-block: 1px solid #d1d5db;
}

.dxv-contact-panel {
  padding-block: 32px;
}

.dxv-contact-panel + .dxv-contact-panel {
  border-top: 1px solid #e5e7eb;
}

.dxv-contact-panel:last-child {
  padding-bottom: 60px;
}

.dxv-contact-panel h2,
.dxv-contact-direct h2 {
  margin: 0 0 20px;
  color: #000000;
  font-family: "Didot", Georgia, serif;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.44px;
  line-height: 1.2;
}

.dxv-contact-line {
  display: flex;
  gap: 8px;
  color: #000000;
  font-size: 14px;
  font-weight: 300;
  line-height: 21px;
}

.dxv-contact-line + .dxv-contact-line {
  margin-top: 12px;
}

.dxv-contact-email {
  align-items: center;
  gap: 12px;
}

.dxv-contact-stack {
  display: flex;
  flex-direction: column;
}

.dxv-contact-stack > span {
  margin-top: 8px;
  font-size: 15px;
  line-height: 22.5px;
}

.dxv-contact-line a,
.dxv-contact-direct a {
  color: #000000;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dxv-contact-line a:hover,
.dxv-contact-direct a:hover {
  text-decoration: none;
}

.dxv-contact-line > a,
.dxv-contact-stack > a {
  font-weight: 500;
}

.dxv-contact-icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: #000000;
}

.dxv-contact-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.dxv-contact-icon-phone {
  width: 32px;
  height: 32px;
}

.dxv-contact-icon-mail,
.dxv-contact-icon-faq {
  width: 24px;
  height: 16px;
}

.dxv-contact-icon-house {
  width: 24px;
  height: 24px;
  margin-top: 2px;
}

.dxv-contact-faq .dxv-contact-line {
  gap: 12px;
  color: #374151;
}

.dxv-contact-direct {
  margin-top: 24px;
  color: #000000;
  font-size: 15px;
  font-weight: 300;
  line-height: 22.5px;
}

.dxv-contact-direct h2 {
  margin-bottom: 16px;
}

.dxv-contact-form {
  width: 100%;
  margin-top: 16px;
  margin-bottom: 48px;
  padding-top: 16px;
  padding-bottom: 6.5px;
}

.dxv-contact-field {
  width: 100%;
}

.dxv-contact-field label {
  display: block;
  margin-bottom: 4px;
  color: #000000;
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
}

.dxv-contact-field input,
.dxv-contact-field select,
.dxv-contact-field textarea {
  display: block;
  width: 100%;
  margin: 0 0 24px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  background: #ffffff;
  color: #000000;
  font-family: "Gotham", "Avenir Next", Arial, sans-serif;
  font-size: 14px;
  font-weight: 300;
  line-height: 20px;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.dxv-contact-field input,
.dxv-contact-field select {
  height: 46px;
  padding: 12px;
}

.dxv-contact-field select {
  appearance: auto;
}

.dxv-contact-field textarea {
  height: 226px;
  min-height: 226px;
  resize: vertical;
  padding: 12px;
}

.dxv-contact-field input:focus,
.dxv-contact-field select:focus,
.dxv-contact-field textarea:focus {
  border-color: #000000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.dxv-contact-name-row {
  display: flex;
  gap: 16px;
}

.dxv-contact-submit {
  display: inline-flex;
  width: 100%;
  height: 48px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border: 1px solid #000000;
  border-radius: 5px;
  background: #000000;
  color: #ffffff;
  font-family: "Gotham", "Avenir Next", Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1.725px;
  line-height: 18px;
  text-transform: uppercase;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}

.dxv-contact-submit:hover,
.dxv-contact-submit:focus {
  border-color: #53565a;
  background: #53565a;
  color: #ffffff;
}

.dxv-contact-image {
  display: none;
}

@media (min-width: 768px) {
  .dxv-contact-container {
    padding-inline: 24px;
  }
}

@media (min-width: 1024px) {
  .dxv-contact-left {
    width: 50%;
    padding-right: 20px;
  }

  .dxv-contact-content {
    width: 80%;
    margin-inline: auto;
  }

  .dxv-contact-breadcrumb-current {
    max-width: none;
    overflow: visible;
    white-space: normal;
  }

  .dxv-contact-intro h1 {
    font-size: 56px;
    letter-spacing: -1.68px;
  }

  .dxv-contact-panel h2,
  .dxv-contact-direct h2 {
    font-size: 28px;
    letter-spacing: -0.84px;
  }

  .dxv-contact-panel:last-child {
    padding-bottom: 54.5px;
  }

  .dxv-contact-line {
    font-size: 15px;
    line-height: 22.5px;
  }

  .dxv-contact-mobile-image {
    display: none;
  }

  .dxv-contact-image {
    display: block;
    width: 50%;
    margin-bottom: 32px;
    padding-left: 40px;
  }

  .dxv-contact-sticky {
    position: sticky;
    top: 80px;
  }
}

@media (max-width: 479px) {
  .dxv-contact-panel:last-child {
    padding-bottom: 63px;
  }
}

@media (min-width: 1280px) {
  .dxv-contact-page {
    padding-top: 140px;
  }
}
</style>
