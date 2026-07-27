<script setup lang="ts">
const policySections = [
  {
    id: 'terms-scope',
    label: 'Scope & acceptance',
    index: '01 / Scope and acceptance',
    heading: 'The terms that govern use of this site',
    paragraphs: [
      'These Terms & Conditions govern access to this website and direct purchases from MAIDSTONE | DXV. By using the site, placing an order, or otherwise engaging with the services offered here, you agree to these terms together with the policies linked from this site.',
      'If a product-specific document, written order confirmation, or applicable law requires a different result, that more specific requirement controls to the extent of the conflict.'
    ]
  },
  {
    id: 'terms-product-information',
    label: 'Product information',
    index: '02 / Product information',
    heading: 'Review specifications before work begins',
    paragraphs: [
      'We work to present product descriptions, finishes, dimensions, prices, and availability accurately. Images and screens can vary, and natural materials or specialty finishes may show variation. Product specifications, pricing, and availability may change without notice, and errors may be corrected when identified.',
      'Do not complete final rough-in or schedule irreversible installation work until you have received and inspected the actual product. Local code, site conditions, and professional installation requirements remain the purchaser’s responsibility.'
    ]
  },
  {
    id: 'terms-orders',
    label: 'Orders & pricing',
    index: '03 / Orders and pricing',
    heading: 'An order is reviewed before it is accepted',
    paragraphs: [
      'Submitting an order is a request to purchase, not an unconditional acceptance. We may need to confirm payment, availability, delivery details, pricing, or other information before accepting or fulfilling an order. We may decline, limit, or cancel an order where permitted by law, including when information is incomplete or a pricing, inventory, or technical error is identified.',
      'Prices, promotions, taxes, delivery charges, and product availability are those presented at the relevant stage of checkout or otherwise confirmed in writing. Orders are intended for lawful end use and may be subject to quantity, destination, or export restrictions.'
    ]
  },
  {
    id: 'terms-delivery-policies',
    label: 'Delivery & policies',
    index: '04 / Delivery and policies',
    heading: 'Read the policies that apply to your order',
    paragraphs: [
      'Shipping, freight delivery, inspection, returns, refunds, and warranty coverage are governed by their respective policy pages and any product-specific terms. Those policies explain important requirements such as inspection timing, return authorization, eligibility, exclusions, and available remedies.',
      'If you purchased through a retailer, showroom, distributor, marketplace, or other third party, that seller controls its own purchase, delivery, return, and refund process.'
    ]
  },
  {
    id: 'terms-site-use',
    label: 'Permitted site use',
    index: '05 / Permitted site use',
    heading: 'Use the site responsibly',
    paragraphs: [
      'You may use this site for personal, lawful, and non-commercial purposes connected with evaluating or purchasing our products. You may not interfere with site operation, attempt unauthorized access, introduce harmful code, scrape or copy content at scale, or use the site in a way that infringes rights or violates law.',
      'Account credentials, order references, and other access details must be kept confidential. Notify Customer Care promptly if you believe they have been compromised.'
    ]
  },
  {
    id: 'terms-intellectual-property',
    label: 'Intellectual property',
    index: '06 / Intellectual property',
    heading: 'Content and brand assets remain protected',
    paragraphs: [
      'The site’s text, imagery, product information, designs, trademarks, logos, and other content are owned by or used with permission by MAIDSTONE | DXV or their respective owners. These terms do not grant a license to reproduce, distribute, modify, display, or commercially use those materials without prior written permission.',
      'If you believe material on this site improperly uses your intellectual property, contact Customer Care with the information needed to review the concern.'
    ]
  },
  {
    id: 'terms-links-submissions',
    label: 'Links & submissions',
    index: '07 / Links and submissions',
    heading: 'External services and unsolicited ideas',
    paragraphs: [
      'External links are provided for convenience. We do not control or endorse third-party websites and are not responsible for their availability, content, security, or practices. Use them subject to their own terms and policies.',
      'Please do not send unsolicited product concepts, design ideas, or confidential materials. Customer communications should be limited to the support, order, product, or service issue you want us to address.'
    ]
  },
  {
    id: 'terms-disclaimers',
    label: 'Disclaimers & limits',
    index: '08 / Disclaimers and limits',
    heading: 'Important limits on site and product information',
    paragraphs: [
      'Except where a written warranty or applicable law states otherwise, the site and its content are provided on an “as available” basis. We do not promise that the site will always be uninterrupted, error-free, or compatible with every device or browser.',
      'To the maximum extent permitted by law, MAIDSTONE | DXV is not responsible for indirect, incidental, special, consequential, or punitive damages arising from site use, installation, removal, delay, loss of use, or similar costs. Nothing in these terms limits rights or remedies that cannot lawfully be limited.'
    ]
  },
  {
    id: 'terms-updates-contact',
    label: 'Updates & contact',
    index: '09 / Updates and contact',
    heading: 'Keep current with the posted version',
    paragraphs: [
      'We may update these terms to reflect changes to the site, products, business practices, or legal requirements. The version posted here is the current version for future use of the site, unless a different effective date is stated.',
      'Questions about these terms, an order, or a product can be directed to Customer Care.'
    ],
    support: true
  }
]

useSeoMeta({
  title: 'Terms & Conditions | MAIDSTONE | DXV',
  description: 'The terms governing website use, direct orders, product information, delivery policies, and intellectual property for MAIDSTONE | DXV.',
  ogTitle: 'Terms & Conditions | MAIDSTONE | DXV',
  ogDescription: 'Terms for use of the MAIDSTONE | DXV website and direct purchases.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <PolicyPageShell
    heading-id="terms-conditions-title"
    eyebrow="Legal"
    title="Terms &amp; Conditions"
    intro="The essential terms for using this site and placing direct orders, organized so the information you need is easy to find."
    updated="Last updated July 19, 2026"
    :sections="policySections"
  />
</template>
