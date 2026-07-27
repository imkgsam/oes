<script setup lang="ts">
type ImageSet = {
  desktop: string
  mobile?: string
  alt: string
}

type CollectionCard = {
  title: string
  eyebrow: string
  href: string
  image: ImageSet
}

type ProductCard = {
  title: string
  collection: string
  price: string
  image: ImageSet
  href?: string
}

type MovementCard = {
  title: string
  copy: string
  href: string
  image: ImageSet
}

type StoryCard = {
  title: string
  copy: string
  image: ImageSet
  href: string
}

// Builds stable Shopify CDN image URLs for the temporary P1 reference assets.
const shopifyImage = (file: string, version: string, width: number) =>
  `https://maidstonedxv.com/cdn/shop/files/${file}?format=webp&v=${version}&width=${width}`
const shopifyArticleImage = (file: string, version: string, width: number) =>
  `https://maidstonedxv.com/cdn/shop/articles/${file}?crop=center&v=${version}&width=${width}`

const hero = {
  kicker: 'MAIDSTONE | DXV',
  title: 'Bathtubs',
  copy: 'Discover ultimate bathing luxury at the intersection of statement piece perfection and restorative indulgence.',
  href: '/collections/bathroom-bathtubs',
  image: {
    desktop: shopifyImage('Home-hero-desktop-v2.jpg', '1774638842', 2400),
    mobile: shopifyImage('Home-hero-mobile-v2.jpg', '1774638862', 600),
    alt: 'Hero bathroom with freestanding bathtub, vanity, mirrors, and warm architectural lighting.'
  }
}

const collections: CollectionCard[] = [
  {
    title: 'Bathtubs',
    eyebrow: 'Soaking forms',
    href: '/collections/bathroom-bathtubs',
    image: {
      desktop: shopifyImage('Home-featured-bathtubs-desktop.jpg', '1773409234', 1040),
      mobile: shopifyImage('Home-featured-bathtubs-mobile.jpg', '1773409242', 600),
      alt: 'Blue freestanding bathtub in a warm bathroom.'
    }
  },
  {
    title: 'Vanities',
    eyebrow: 'Bath furniture',
    href: '/collections/bathroom-vanities',
    image: {
      desktop: shopifyImage('Home-featured-vanities-desktop.jpg', '1775151310', 1336),
      mobile: shopifyImage('Home-featured-vanities-mobile.jpg', '1775151319', 600),
      alt: 'Luxury bathroom vanity with framed mirrors.'
    }
  },
  {
    title: 'Kitchen Faucets',
    eyebrow: 'Kitchen',
    href: '/collections/kitchen',
    image: {
      desktop: shopifyImage('Home-featured-kitchen-faucets-desktop.jpg', '1773409264', 1337),
      mobile: shopifyImage('Home-featured-kitchen-faucets-mobile.jpg', '1773409272', 600),
      alt: 'Modern kitchen with gold faucet and wooden counter.'
    }
  },
  {
    title: 'Showers',
    eyebrow: 'Bathing',
    href: '#',
    image: {
      desktop: shopifyImage('Home-featured-showers-desktop.jpg', '1773409298', 1338),
      mobile: shopifyImage('Home-featured-showers-mobile.jpg', '1773409306', 600),
      alt: 'Black shower set mounted on a marble wall.'
    }
  },
  {
    title: 'Kitchen Sinks',
    eyebrow: 'Preparation',
    href: '/collections/kitchen',
    image: {
      desktop: shopifyImage('Home-featured-kitchen-sinks-desktop.jpg', '1775151338', 1336),
      mobile: shopifyImage('Home-featured-vanities-mobile_c7c333b5-6a5d-4e38-b942-cba7fe46e96c.jpg', '1775151348', 600),
      alt: 'Kitchen sink shown in a refined residential kitchen.'
    }
  },
  {
    title: 'Bathroom Sinks',
    eyebrow: 'Wash areas',
    href: '/collections/bathroom-sinks-pedestal',
    image: {
      desktop: shopifyImage('Home-featured-bathroom-sinks-desktop.jpg', '1775151376', 800),
      mobile: shopifyImage('Home-featured-bathroom-sinks-mobile.jpg', '1775151383', 600),
      alt: 'Bathroom sink with classical interior styling.'
    }
  },
  {
    title: 'Bathroom Sink Faucets',
    eyebrow: 'Fittings',
    href: '#',
    image: {
      desktop: shopifyImage('Home-featured-bathroom-sink-faucets-desktop.jpg', '1775151400', 1336),
      mobile: shopifyImage('Home-featured-bathroom-sink-faucets-mobile.jpg', '1775151408', 600),
      alt: 'Bathroom sink faucet detail.'
    }
  },
  {
    title: 'Toilets',
    eyebrow: 'Fixtures',
    href: '#',
    image: {
      desktop: shopifyImage('Home-featured-toilets-desktop.jpg', '1773409324', 1339),
      mobile: shopifyImage('Home-featured-toilets-mobile.jpg', '1773409336', 600),
      alt: 'Modern white toilet in a bathroom with patterned floor.'
    }
  }
]

const featureTiles = [
  {
    title: 'Freestanding Bathtubs',
    copy: '',
    href: '/collections/bathroom-bathtubs',
    image: {
      desktop: shopifyImage('featured-products-acrylic-tubs-desktop.jpg', '1773409397', 2140),
      mobile: shopifyImage('featured-products-acrylic-tubs-mobile.jpg', '1773409404', 600),
      alt: 'Freestanding bathtub in a modern bathroom with green wall.'
    }
  },
  {
    title: 'Solid Surface Bathtubs',
    copy: '',
    href: '/collections/bathroom-bathtubs',
    image: {
      desktop: shopifyImage('featured-products-solid-surface-desktop.jpg', '1773409430', 2141),
      mobile: shopifyImage('featured-products-solid-surface-mobile.jpg', '1773409438', 600),
      alt: 'White freestanding bathtub in a bright bathroom.'
    }
  }
]

const movements: MovementCard[] = [
  {
    title: 'Classic',
    copy: 'Ornamental lineage, balanced proportions, and architecture that carries weight.',
    href: '/series',
    image: {
      desktop: shopifyImage('classic-desktop.png', '1773694163', 1488),
      mobile: shopifyImage('classic-mobile.png', '1773694174', 600),
      alt: 'Long stone archway corridor with dark classical atmosphere.'
    }
  },
  {
    title: 'Golden Era',
    copy: 'Deco precision, polished metal, and theatrical contrast for statement rooms.',
    href: '/series',
    image: {
      desktop: shopifyImage('golden-desktop.png', '1773694187', 1488),
      mobile: shopifyImage('golden-mobile.png', '1773694194', 600),
      alt: 'Close-up of classical stone columns with steps.'
    }
  },
  {
    title: 'Contemporary',
    copy: 'Graphic restraint, crisp geometry, and surface-led compositions for modern homes.',
    href: '/series',
    image: {
      desktop: shopifyImage('contemporary-desktop.png', '1773694135', 1488),
      mobile: shopifyImage('contemporary-mobile.png', '1773694147', 600),
      alt: 'Dark gray geometric pattern on a black background.'
    }
  }
]

const productRows: ProductCard[][] = [
  [
    {
      title: '67 Inch Cast Iron Skirted Tub Matte Black Feet | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$17,800.00',
      href: '/products/maidstone-dxv-67-inch-cast-iron-skirted-tub-matte-black-feet-dxv-corin',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1778528379/D2201CO.jpg',
        alt: 'Cast iron skirted bathtub with dark feet.'
      }
    },
    {
      title: 'Ivera 67-inch Cast Iron Double Ended Tub With Mirror Skirt | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$19,300.00',
      href: '/products/maidstone-dxv-67-inch-cast-iron-double-ended-tub-with-mirror-skirt-dxv-d2201ir-67499',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1778526643/websites-product-info-and-content/maidstone/product-info/Website/D2201IR-67.499_new.jpg',
        alt: 'Double ended cast iron bathtub with mirrored skirt.'
      }
    },
    {
      title: '70-inch White Cast Iron Double Ended Bathtub | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$19,900.00',
      href: '/products/maidstone-dxv-70-inch-white-cast-iron-double-ended-bathtub-dxv-d2201ca-70415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1771948179/abg-graphics/original-images/maidstone-dxv/maidsone-dxv-galveston-%20-catalog-cover/madistone-dxv-calden-front-wide-web.jpg',
        alt: 'White double ended bathtub on a light background.'
      }
    },
    {
      title: '70-inch Cast Iron Double Ended Skirted Bathtub | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$19,300.00',
      href: '/products/maidstone-dxv-70-inch-cast-iron-double-ended-skirted-bathtub-dxv-d2201ge-70415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1779470494/websites-product-info-and-content/maidstone/product-info/Website/D2201GE-70.415_New.jpg',
        alt: 'Cast iron double ended skirted bathtub.'
      }
    },
    {
      title: 'Marella 67-inch Cast Iron Skirted Double Ended Bathtub',
      collection: 'MAIDSTONE | DXV',
      price: '$8,712.00',
      href: '/products/maidstone-dxv-marella-67-inch-cast-iron-double-ended-skirted-tub-no-faucet-drillings-white-d2201ma-67-0415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1769534508/abg-graphics/original-images/maidstone-dxv/bathtubs/cast-iron-tubs/marella/jpeg/m-dxv-marella-classic-01-front-deco.jpg',
        alt: 'Marella cast iron bathtub.'
      }
    },
    {
      title: 'Rio Cast Iron Double Ended Skirted Tub - No Faucet Drillings',
      collection: 'MAIDSTONE | DXV',
      price: '$10,535.00',
      href: '/products/maidstone-dxv-rio-cast-iron-double-ended-skirted-tub-no-faucet-drillings-rio',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1769530388/abg-graphics/original-images/maidstone-dxv/bathtubs/cast-iron-tubs/rio/jpeg/m-dxv-_rio-classic-01-front-deco.jpg',
        alt: 'Rio cast iron bathtub.'
      }
    },
    {
      title: 'Una 67-in. Cast Iron Double Ended Skirted Bathtub - White',
      collection: 'MAIDSTONE | DXV',
      price: '$8,712.00',
      href: '/products/maidstone-dxv-una-67-inch-cast-iron-double-ended-skirted-bathtub-no-faucet-drillings-white-d2201un-67-0415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1769534659/abg-graphics/original-images/maidstone-dxv/bathtubs/cast-iron-tubs/una/jpeg/m-dxv-una-classic-01-front-deco.jpg',
        alt: 'Una white cast iron bathtub.'
      }
    },
    {
      title: '67-inch White Cast Iron Roll Top Skirted Tub | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$19,900.00',
      href: '/products/maidstone-dxv-67-inch-white-cast-iron-roll-top-skirted-tub-dxv-d2201cr-67415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1778526933/websites-product-info-and-content/maidstone/product-info/Website/D2201CR-67.415_new.jpg',
        alt: 'White roll top skirted bathtub.'
      }
    },
    {
      title: '67-inch White Cast Iron Double Ended Skirted Tub | Dxv',
      collection: 'MAIDSTONE | DXV',
      price: '$22,000.00',
      href: '/products/maidstone-dxv-67-inch-white-cast-iron-double-ended-skirted-tub-dxv-d2201gi-67415',
      image: {
        desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1778526643/websites-product-info-and-content/maidstone/product-info/Website/D2201GI-67.415_new.jpg',
        alt: 'White double ended skirted bathtub.'
      }
    }
  ]
]
const featuredProducts = productRows[0] ?? []

const browseLook = {
  desktop: shopifyImage('Home-browse-look-desktop.jpg', '1773409512', 2400),
  mobile: shopifyImage('Home-browse-look-mobile.jpg', '1775072227', 600),
  alt: 'Modern bathroom with freestanding bathtub, wooden vanity, and decorative elements.'
}

const lookProducts: ProductCard[] = [
  {
    title: 'Emryn 67 Inch Slipper Acrylic Freestanding Tub',
    collection: 'MAIDSTONE',
    price: '$3,100.00',
    image: {
      desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1772813125/abg-graphics/original-projects/vtb-maidstone/usr00083-03-maidstone-dxvbathing-crop-images/homepage/maidstone-_emryn-wht-angle-deco-1400x1400.jpg',
      alt: 'Emryn freestanding tub.'
    }
  },
  {
    title: 'Contemporary High Flow Freestanding Bathtub Faucet',
    collection: 'MAIDSTONE',
    price: '$1,610.00',
    image: {
      desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1772813202/abg-graphics/original-projects/vtb-maidstone/usr00083-03-maidstone-dxvbathing-crop-images/homepage/maidstone-contemporary-high-flow-freestanding-bathtub-faucet.jpg',
      alt: 'Contemporary freestanding bathtub faucet.'
    }
  },
  {
    title: 'Valmont 72 Inch Fluted Vanity Base',
    collection: 'MAIDSTONE',
    price: '$3,990.00',
    image: {
      desktop: shopifyImage('new-featured-products-vanity-desktop.jpg', '1773409568', 900),
      alt: 'Valmont fluted vanity base.'
    }
  },
  {
    title: 'Cyprus Widespread Bathroom Sink Faucet',
    collection: 'MAIDSTONE',
    price: '$967.00',
    image: {
      desktop: shopifyImage('Home-featured-bathroom-sink-faucets-desktop.jpg', '1775151400', 800),
      alt: 'Cyprus widespread bathroom sink faucet.'
    }
  },
  {
    title: 'Aydin 20 By 28 Inch Oval Lighted Mirror With Anti-fog',
    collection: 'MAIDSTONE',
    price: '$538.00',
    image: {
      desktop: 'https://res.cloudinary.com/american-bath-group/image/upload/w_800,h_800,c_fill/v1772813295/abg-graphics/original-projects/vtb-maidstone/usr00083-03-maidstone-dxvbathing-crop-images/homepage/maidstone-aydin-oval-lighted-mirror.jpg',
      alt: 'Aydin oval lighted mirror.'
    }
  }
]

const inspirationCards: StoryCard[] = [
  {
    title: 'MAIDSTONE | DXV Design Movements',
    copy: 'Whether drawn to the articulated heritage of the Classic era, the bold geometry of the Golden Era epoch, or the serene fluidity of the Contemporary aesthetic, each movement offers a distinct pathway to elevated living.',
    href: '/series',
    image: {
      desktop: shopifyArticleImage('Copper_bath_from_the_Golden_Era_f5c427b0-b474-479f-9af2-5281d093fc0e.jpg', '1777467827', 1336),
      alt: 'Copper bath from the Golden Era.'
    }
  },
  {
    title: 'Jordan Vaughn Luxury Bathroom Renovation Interview',
    copy: 'For me, great bathrooms should feel like small retreats within the home. They’re spaces where you begin and end your day, so they deserve the same level of attention and beauty as the rest of the house.',
    href: '/blogs',
    image: {
      desktop: shopifyArticleImage('galvestonebeachhouse_b190a520-11c5-4744-a1d7-197b29966781.jpg', '1777467902', 1564),
      alt: 'Galveston beach house bathroom.'
    }
  },
  {
    title: 'Design Trends 2026: Specialty Tubs',
    copy: 'These curated specialty bathing vessels redefine the meaning of opulence. Specialty bathtubs are understated, subtle and the perfect luxurious anchor piece.',
    href: '/blogs',
    image: {
      desktop: shopifyArticleImage('soren-carbon-fiber-tub-thumbnail_10e57fe0-addb-4429-8582-226cbff2a0c1.jpg', '1777062737', 668),
      alt: 'Soren carbon fiber tub.'
    }
  }
]

useSeoMeta({
  title: 'Meilong Ceramics | MAIDSTONE DXV Reference Home Replica',
  description:
    'P1 Nuxt homepage recreation for Meilong Ceramics using the MAIDSTONE DXV reference layout, typography, imagery, and motion direction.',
  ogTitle: 'Meilong Ceramics',
  ogDescription: 'Nuxt storefront homepage visual replica workbench.',
  ogImage: hero.image.desktop,
  twitterCard: 'summary_large_image'
})

useHead({
  link: [
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Book.woff2?v=1771863016' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Medium.woff2?v=1771863004' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Didot-regular.woff2?v=1771863042' }
  ]
})
</script>

<template>
  <main class="dxv-home">
    <HomeHero :hero="hero" />
    <HomeCollectionCarousel :items="collections" />
    <section class="dxv-quote dxv-reveal" aria-label="Brand statement">
      <p>
        For the ultimate cohesive design, consider a curated collection of remarkable products for
        the well-appointed luxury bath.
      </p>
      <a class="dxv-discover-link" href="/product/collections">Discover more</a>
    </section>
    <HomeFeatureGrid :items="featureTiles" />
    <HomeDesignMovements :items="movements" />
    <HomeBrowseLook :image="browseLook" :products="lookProducts" />
    <HomeDoubleHero />
    <HomeProductCarousel title="New Arrivals" :items="featuredProducts" />
    <HomeInspirationHub :items="inspirationCards" />
    <HomeAboutBanner />
    <HomeSocialStrip />
  </main>
</template>
