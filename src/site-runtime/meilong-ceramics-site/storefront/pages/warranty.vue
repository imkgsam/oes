<script setup lang="ts">
const policySections = [
  {
    id: 'warranty-coverage',
    label: 'Coverage & remedy',
    index: '01 / Warranty coverage',
    heading: 'What this warranty is designed to cover',
    paragraphs: [
      'This limited warranty addresses verified defects in materials or workmanship under normal residential use. Coverage applies only to the product itself and is subject to the product category, installation requirements, exclusions, and conditions described on this page.',
      'If a covered defect is confirmed, MAIDSTONE | DXV may, at its discretion, repair the product, provide a replacement or suitable adjustment, or issue a refund of the original product purchase price. This is the exclusive remedy provided by the warranty.'
    ]
  },
  {
    id: 'warranty-bathtubs',
    label: 'Bathtubs',
    index: '02 / Bathtubs',
    heading: 'Coverage for a lasting centerpiece',
    paragraphs: [
      'Bathtubs in porcelain, cast iron, MINERALCAST, and acrylic carry a limited lifetime warranty to the original residential purchaser against defects that make the tub unsuitable for normal residential use. Pre-installed fixtures and exterior paint coverage are limited to one year for mechanical malfunction, cracking, peeling, or lifting, as applicable.',
      'The limited lifetime coverage remains with the original non-commercial owner while they own the bathtub and requires installation by a qualified licensed plumber. Commercial purchasers receive a one-year limited warranty for the applicable bathtub materials, paint, and drain components.'
    ]
  },
  {
    id: 'warranty-fixtures',
    label: 'Fixtures & accessories',
    index: '03 / Fixtures & accessories',
    heading: 'Faucets, brass, and supporting pieces',
    paragraphs: [
      'Faucets, brass products, and accessories are warranted against manufacturing and mechanical defects for five years from purchase when installed by a qualified licensed plumber. Quarter-turn ceramic valves are intended to operate through a quarter turn; forcing a handle beyond its designed travel can cause damage that is not a manufacturing defect.',
      'Steel clawfoot tub caddies and stainless-steel sink grids are warranted against manufacturing and mechanical defects for one year from purchase. Moisture exposure can affect metal surfaces over time and is not itself evidence of a defect.'
    ]
  },
  {
    id: 'warranty-sinks',
    label: 'Sinks & vanities',
    index: '04 / Sinks & vanities',
    heading: 'Coverage varies by material and construction',
    paragraphs: [
      'Vitreous china sinks are warranted against material and workmanship defects for one year from purchase. Vanity sinks are warranted for five years from purchase. Both require installation by a qualified licensed plumber and are intended for normal use and care.',
      'Fireclay, stainless-steel, and cast-iron sinks are warranted against manufacturing and mechanical defects for two years from purchase and carry a 10-year warranty against fading and staining, subject to proper installation and care.'
    ]
  },
  {
    id: 'warranty-copper-finishes',
    label: 'Copper & living finishes',
    index: '05 / Copper & living finishes',
    heading: 'Natural variation is part of the material',
    paragraphs: [
      'Copper products carry a limited lifetime warranty against qualifying manufacturer defects, including mechanical malfunction, leaking, structural damage, welds, and slopes. Products must be inspected before installation.',
      'Copper, bronze, nickel, and other living finishes naturally change with age and use. Variations in patina, color, texture, and surface character are inherent to these materials and are not covered as defects.'
    ]
  },
  {
    id: 'warranty-exclusions',
    label: 'Exclusions & claims',
    index: '06 / Exclusions & claims',
    heading: 'Inspect before installation and retain your records',
    paragraphs: [
      'This warranty does not cover labor, removal, reinstallation, shipping upgrades, incidental or consequential costs, normal wear, misuse, abuse, alteration, improper repair, improper cleaning, or neglect. Product-specific exclusions may also apply.',
      'Inspect every product at delivery and before installation. Report shortages, loss, freight damage, defects, or missing parts within 48 hours of receipt, with photos and your order details where possible. Late freight claims may be restricted by the carrier.'
    ]
  },
  {
    id: 'warranty-support',
    label: 'Warranty support',
    index: '07 / Warranty support',
    heading: 'Start with the product and order details',
    paragraphs: [
      'When requesting warranty assistance, include the product name or SKU, proof of purchase, installation details, a concise description of the concern, and clear photos or video when relevant. Customer Care will help identify the appropriate next step.'
    ],
    support: true
  }
]

useSeoMeta({
  title: 'Warranty | MAIDSTONE | DXV',
  description: 'Product warranty coverage, exclusions, inspection requirements, and support guidance for MAIDSTONE | DXV products.',
  ogTitle: 'Warranty | MAIDSTONE | DXV',
  ogDescription: 'Product warranty coverage and support guidance.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <PolicyPageShell
    heading-id="warranty-title"
    eyebrow="Product support"
    title="Warranty"
    intro="Clear coverage guidance by product type, along with the inspection and claim steps that help us review an issue efficiently."
    updated="Last updated July 19, 2026"
    :sections="policySections"
  />
</template>
