<script setup lang="ts">
const policySections = [
  {
    id: 'privacy-scope',
    label: 'Scope',
    index: '01 / Scope',
    heading: 'How this notice applies',
    paragraphs: [
      'This Privacy Policy explains how MAIDSTONE | DXV handles personal information collected through this website, customer service interactions, and direct purchase activity. It applies to information associated with an identifiable person or household, subject to applicable law.',
      'This notice does not govern third-party websites, services, retailers, or showrooms that may link to or sell our products. Their own privacy notices apply to information you provide directly to them.'
    ]
  },
  {
    id: 'privacy-information',
    label: 'Information we collect',
    index: '02 / Information we collect',
    heading: 'Information needed to serve you',
    paragraphs: [
      'The information we handle depends on how you use the site and the services you request. We collect only the information reasonably needed for the purposes described below.'
    ],
    bullets: [
      'Contact and delivery details you provide for an order, inquiry, account, or service request.',
      'Order, payment confirmation, return, and customer-service details connected with a transaction.',
      'Device, browser, network, and site-interaction data collected through cookies and similar technologies where they are enabled.',
      'Messages, photos, and other materials you choose to send to Customer Care.'
    ]
  },
  {
    id: 'privacy-use',
    label: 'How we use information',
    index: '03 / How we use information',
    heading: 'To operate orders and improve service',
    paragraphs: [
      'We may use personal information to process orders and payments, arrange delivery, provide customer support, administer accounts, respond to questions, manage returns or warranty requests, and protect the security and integrity of our services.',
      'Where permitted, we may also use information to understand site performance, prevent fraud, meet legal obligations, maintain records, and send marketing communications that you have elected to receive. You can opt out of marketing emails through the unsubscribe link in the message.'
    ]
  },
  {
    id: 'privacy-sharing',
    label: 'Service providers',
    index: '04 / Service providers',
    heading: 'When information is shared to complete a service',
    paragraphs: [
      'We may disclose information to service providers that help us operate the site and fulfill customer requests, such as payment processors, commerce and hosting providers, delivery carriers, customer-support tools, technology vendors, and professional advisers. They may use the information only as needed to provide their services or comply with law.',
      'We may also disclose information when required by law, to protect rights and safety, to investigate fraud or misuse, or as part of a corporate transaction. We do not authorize a service provider to use your information for an unrelated purpose.'
    ]
  },
  {
    id: 'privacy-cookies',
    label: 'Cookies & controls',
    index: '05 / Cookies & controls',
    heading: 'Your browser helps manage site preferences',
    paragraphs: [
      'Cookies and similar technologies can help remember cart or session activity, understand how pages perform, and keep the site secure. Your browser may allow you to review, block, or delete cookies; doing so can affect functions such as checkout, saved preferences, or account access.',
      'Where a consent or preference tool is available, use it to manage the choices presented for your location. Browser settings and device controls may provide additional choices.'
    ]
  },
  {
    id: 'privacy-security',
    label: 'Security & retention',
    index: '06 / Security & retention',
    heading: 'Reasonable safeguards, limited retention',
    paragraphs: [
      'We use administrative, technical, and organizational safeguards designed to protect personal information. No internet transmission or storage method is completely secure, so please do not send sensitive information through an unsecured channel unless requested through a protected process.',
      'We retain information only for as long as reasonably necessary for the purpose for which it was collected, including order fulfillment, support, legal, accounting, dispute-resolution, and security requirements.'
    ]
  },
  {
    id: 'privacy-rights',
    label: 'Your rights',
    index: '07 / Your rights and choices',
    heading: 'Your privacy rights',
    paragraphs: [
      'Depending on where you live and applicable law, you may have the right to access, correct, delete, or receive a portable copy of personal information we hold about you. You may also have rights to restrict certain processing, learn more about how information is handled, or appeal a decision about a privacy request.',
      'To make a request, contact Customer Care and clearly identify the right you want to exercise. We may need to verify your identity and authority before acting on a request. Some rights are subject to legal exceptions, including records we must retain to complete a transaction, prevent fraud, meet legal obligations, or resolve a dispute.'
    ]
  },
  {
    id: 'do-not-sell',
    label: 'Do Not Sell or Share',
    index: '08 / Privacy choices',
    heading: 'Do Not Sell or Share My Personal Information',
    paragraphs: [
      'Depending on where you live and applicable law, you may have the right to opt out of the sale or sharing of personal information. This can include the use of cookies or similar technologies for cross-context behavioral or targeted advertising.',
      'Use any cookie preference controls presented on this site to manage available choices. You may also contact Customer Care to submit an opt-out request. This choice is separate from unsubscribing from promotional email: operational messages about an order, delivery, account, return, or warranty service may still be sent when needed.'
    ],
    support: true
  },
  {
    id: 'privacy-children-links',
    label: 'Children & external links',
    index: '09 / Children and external links',
    heading: 'Use third-party services with care',
    paragraphs: [
      'This site is not directed to children. If you believe a child has provided personal information to us without appropriate consent, contact Customer Care so the request can be reviewed.',
      'Links to external websites, social platforms, and other services are provided for convenience. Their privacy and security practices are governed by their own policies, not this notice.'
    ]
  },
  {
    id: 'privacy-contact',
    label: 'Updates & contact',
    index: '10 / Updates and contact',
    heading: 'Questions about this notice?',
    paragraphs: [
      'We may update this Privacy Policy when our practices, services, or legal requirements change. The latest version and its update date will be posted here.',
      'For a privacy question or request, contact Customer Care and identify your request as clearly as possible.'
    ],
    support: true
  }
]

useSeoMeta({
  title: 'Privacy Policy | MAIDSTONE | DXV',
  description: 'How MAIDSTONE | DXV handles personal information, cookies, privacy choices, security, and customer requests.',
  ogTitle: 'Privacy Policy | MAIDSTONE | DXV',
  ogDescription: 'Information about privacy, data use, cookies, and your choices.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <PolicyPageShell
    heading-id="privacy-policy-title"
    eyebrow="Legal & privacy"
    title="Privacy Policy"
    intro="A plain-language guide to the personal information we handle, why we use it, and the choices available to you."
    updated="Last updated July 19, 2026"
    :sections="policySections"
  />
</template>
