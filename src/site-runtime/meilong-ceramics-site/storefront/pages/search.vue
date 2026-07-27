<script setup lang="ts">
type SearchResultType = 'Product' | 'Collection' | 'Inspiration' | 'Support'

type SearchResult = {
  title: string
  eyebrow: SearchResultType
  description: string
  href: string
  image?: string
  meta?: string
  terms: string[]
}

const route = useRoute()
const searchInput = ref('')

const searchResults: SearchResult[] = [
  {
    title: '20 Inch Pedestal Sink - 4 Inch Faucet Center',
    eyebrow: 'Product',
    description: 'Compact vitreous china pedestal sink with a 4 inch faucet center for powder rooms and refined bathroom layouts.',
    href: '/products/maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS21-4D.jpg?v=1777322596',
    meta: '$577.00',
    terms: ['pedestal', 'sink', 'bathroom', 'faucet', 'powder room']
  },
  {
    title: '26 Inch Porcelain Pedestal Bathroom Sink',
    eyebrow: 'Product',
    description: 'Porcelain pedestal bathroom sink with a classic freestanding profile and durable everyday surface.',
    href: '/products/maidstone-26-inch-porcelain-pedestal-bathroom-sink-138-pds28',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS28.jpg?v=1777322559',
    meta: '$559.00',
    terms: ['porcelain', 'pedestal', 'bathroom sink', 'classic']
  },
  {
    title: 'Crest 26 Inch Pedestal Bathroom Sink - 8 Inch Faucet Drillings',
    eyebrow: 'Product',
    description: 'Architectural pedestal sink with 8 inch faucet drillings and a refined Crest silhouette.',
    href: '/products/maidstone-crest-26-inch-pedestal-bathroom-sink-8-inch-faucet-drillings-138-pds30-8',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-pds30-8_lifestyle.jpg?v=1777322594',
    meta: '$840.00',
    terms: ['crest', 'pedestal', 'sink', '8 inch', 'faucet']
  },
  {
    title: 'Pedestal Sinks',
    eyebrow: 'Collection',
    description: 'Browse pedestal bathroom sinks with compact footprints, timeless profiles, and freestanding installation.',
    href: '/collections/bathroom-sinks-pedestal',
    image: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=600',
    meta: '11 products',
    terms: ['pedestal sinks', 'bathroom sinks', 'collection']
  },
  {
    title: 'Bathtubs',
    eyebrow: 'Collection',
    description: 'Discover freestanding, cast iron, solid surface, and soaking bathtubs for statement bath environments.',
    href: '/collections/bathroom-bathtubs',
    image: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/navigation-bathtubs-desktop.jpg?format=webp&v=1773425204&width=600',
    meta: 'Bathroom collection',
    terms: ['bath', 'bathtub', 'freestanding', 'soaking', 'wellness']
  },
  {
    title: 'Design Movements',
    eyebrow: 'Inspiration',
    description: 'Explore MAIDSTONE | DXV design movements and the visual language behind the series experience.',
    href: '/series',
    image: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/navigation-desktop.png?format=webp&v=1777037184&width=600',
    meta: 'Series',
    terms: ['series', 'design', 'movement', 'inspiration']
  },
  {
    title: 'Warranty',
    eyebrow: 'Support',
    description: 'Review warranty coverage, support expectations, and ownership resources for MAIDSTONE | DXV products.',
    href: '/warranty',
    meta: 'Customer support',
    terms: ['warranty', 'support', 'service', 'coverage']
  },
  {
    title: 'Contact Us',
    eyebrow: 'Support',
    description: 'Reach the MAIDSTONE | DXV team for product questions, project help, and customer support.',
    href: '/contact',
    meta: 'Support',
    terms: ['contact', 'help', 'question', 'support']
  }
]

const suggestions = ['Check your spelling', 'Try rephrasing or shortening your search', 'Try searching for a similar product']
const trendingSearches = ['Pedestal Sinks', 'Bathtubs', 'Console Sinks', 'Bathroom Vanities']
const popularLinks = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Find A Service Part', href: '/contact' },
  { label: 'Order Status', href: '#' },
  { label: 'Product Warranty', href: '/warranty' },
  { label: 'Design Movements', href: '/series' }
]
const supportItems = [
  {
    title: 'Chat With Us',
    description: '7:00am-10:00pm CT\n7 Days a Week'
  },
  {
    title: 'Call Our Team',
    description: 'Monday-Friday 8:00am-5:00pm (CT)',
    action: '1-800-456-4537'
  },
  {
    title: 'Product Support',
    description: 'Need help with your purchased product? First locate your product model number.',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Product Support', href: '/contact' },
      { label: 'Product Warranty', href: '/warranty' }
    ]
  }
]
const query = computed(() => String(route.query.q ?? '').trim())
const normalizedQuery = computed(() => query.value.toLowerCase())

const filteredResults = computed(() => {
  if (!normalizedQuery.value) return searchResults

  return searchResults.filter((result) => {
    const haystack = [
      result.title,
      result.eyebrow,
      result.description,
      result.meta ?? '',
      ...result.terms
    ].join(' ').toLowerCase()

    return normalizedQuery.value.split(/\s+/).every((term) => haystack.includes(term))
  })
})

const productCount = computed(() => filteredResults.value.filter((result) => result.eyebrow === 'Product').length)
const collectionCount = computed(() => filteredResults.value.filter((result) => result.eyebrow === 'Collection').length)

useSeoMeta({
  title: () => query.value ? `Search results for ${query.value} | MAIDSTONE | DXV` : 'Search | MAIDSTONE | DXV',
  description: 'Search MAIDSTONE | DXV products, collections, inspiration, and support resources.'
})

// Submits in-page searches by updating the canonical query parameter.
const submitInlineSearch = async () => {
  const value = searchInput.value.trim()
  await navigateTo({
    path: '/search',
    query: value ? { q: value } : {}
  })
}

watch(query, (value) => {
  searchInput.value = value
}, { immediate: true })
</script>

<template>
  <main class="dxv-search-page">
    <nav class="dxv-search-breadcrumb" aria-label="Breadcrumb">
      <NuxtLink to="/">Home</NuxtLink>
      <span aria-hidden="true">/</span>
      <span>Search Results</span>
    </nav>

    <section class="dxv-search-hero" aria-labelledby="search-page-title">
      <h1 id="search-page-title">Search</h1>
      <form class="dxv-search-page-form" role="search" action="/search" method="get" @submit.prevent="submitInlineSearch">
        <label for="dxv-search-page-input">Search</label>
        <div class="dxv-search-page-field">
          <span aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="m19 20 6 6M13 22.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z" stroke="currentColor" stroke-width="1.7" />
            </svg>
          </span>
          <input id="dxv-search-page-input" v-model="searchInput" name="q" type="search" autocomplete="off" placeholder="What are you looking for?" />
        </div>
        <button type="submit">Search</button>
      </form>
    </section>

    <section class="dxv-search-results-shell" aria-label="Search results">
      <div v-if="filteredResults.length" class="dxv-search-result-state">
        <p>{{ filteredResults.length }} results for</p>
        <h2>{{ query || 'All results' }}</h2>
        <div class="dxv-search-summary">
          <span>{{ productCount }} Products</span>
          <span>{{ collectionCount }} Collections</span>
          <span>{{ filteredResults.length - productCount - collectionCount }} Resources</span>
        </div>
        <div class="dxv-search-result-list">
          <article v-for="result in filteredResults" :key="result.href" class="dxv-search-result-row">
            <div>
              <span>{{ result.eyebrow }}</span>
              <NuxtLink :to="result.href">{{ result.title }}</NuxtLink>
              <p>{{ result.description }}</p>
            </div>
            <small v-if="result.meta">{{ result.meta }}</small>
          </article>
        </div>
      </div>

      <section v-else class="dxv-search-empty" aria-label="No search results">
        <h2>Sorry, we found no results.<br>Try a new search or explore these suggestions.</h2>
        <div class="dxv-search-discovery">
          <section>
            <h3>Our suggestions for you</h3>
            <ul>
              <li v-for="item in suggestions" :key="item">{{ item }}</li>
            </ul>
          </section>
          <section>
            <h3>Trending Searches</h3>
            <nav aria-label="Trending searches">
              <NuxtLink v-for="term in trendingSearches" :key="term" :to="{ path: '/search', query: { q: term } }">
                {{ term }}
              </NuxtLink>
            </nav>
          </section>
          <section>
            <h3>Popular links</h3>
            <nav aria-label="Popular links">
              <NuxtLink v-for="link in popularLinks" :key="link.label" :to="link.href">
                {{ link.label }}
              </NuxtLink>
            </nav>
          </section>
        </div>
      </section>
    </section>

    <section class="dxv-search-support" aria-labelledby="dxv-search-support-title">
      <div>
        <p>Help and Support</p>
        <h2 id="dxv-search-support-title">Can't find what<br>you're looking<br>for?</h2>
      </div>
      <div class="dxv-search-support-list">
        <article v-for="item in supportItems" :key="item.title">
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <strong v-if="item.action">{{ item.action }}</strong>
          <nav v-if="item.links" aria-label="Product support links">
            <NuxtLink v-for="link in item.links" :key="link.label" :to="link.href">
              {{ link.label }}
            </NuxtLink>
          </nav>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dxv-search-page {
  min-height: 100dvh;
  background: #ffffff;
  color: #3d3d3d;
  font-family: "Gotham", "Avenir Next", Arial, sans-serif;
}

.dxv-search-breadcrumb {
  display: flex;
  width: min(100% - 64px, 1380px);
  align-items: center;
  gap: 9px;
  margin: 0 auto;
  padding-top: 148px;
  color: #6f6f6f;
  font-size: 12px;
  line-height: 1;
}

.dxv-search-breadcrumb a {
  color: inherit;
  text-decoration: none;
}

.dxv-search-hero {
  width: min(100% - 64px, 1380px);
  margin: 34px auto 0;
}

.dxv-search-hero h1 {
  margin: 0 0 28px;
  color: #3a3a3a;
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 0;
  line-height: 1.2;
}

.dxv-search-page-form {
  display: grid;
  grid-template-columns: minmax(0, 720px) 106px;
  gap: 20px;
  align-items: end;
  max-width: 846px;
}

.dxv-search-page-form label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.dxv-search-page-field {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  border-bottom: 1px solid #9e9e9e;
  color: #6d6d6d;
}

.dxv-search-page-field span,
.dxv-search-page-field svg {
  display: block;
  width: 23px;
  height: 23px;
}

.dxv-search-page-form input {
  min-width: 0;
  border: 0;
  border-radius: 0;
  padding: 0 0 9px;
  background: transparent;
  color: #3c3c3c;
  font: inherit;
  font-size: 30px;
  font-weight: 300;
  line-height: 1.15;
  outline: none;
}

.dxv-search-page-form input::placeholder {
  color: #8a8a8a;
  opacity: 1;
}

.dxv-search-page-form button {
  border: 0;
  background: #202020;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  height: 42px;
  min-width: 106px;
  padding: 0 22px;
  transition:
    background 180ms ease,
    transform 180ms ease;
}

.dxv-search-page-form button:hover {
  background: #3d3d3d;
}

.dxv-search-page-form button:active {
  transform: translateY(1px);
}

.dxv-search-results-shell {
  width: min(100% - 64px, 1380px);
  margin: 0 auto;
  padding: 44px 0 104px;
}

.dxv-search-result-state > p {
  margin: 0 0 10px;
  color: #797979;
  font-size: 14px;
}

.dxv-search-result-state h2 {
  margin: 0;
  color: #3d3d3d;
  font-size: clamp(34px, 4vw, 58px);
  font-weight: 300;
  line-height: 1.08;
}

.dxv-search-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 32px;
  margin: 34px 0 0;
  color: #777777;
  font-size: 14px;
}

.dxv-search-result-list {
  display: grid;
  margin-top: 28px;
  border-top: 1px solid #d7d7d7;
}

.dxv-search-result-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid #d7d7d7;
}

.dxv-search-result-row span {
  display: block;
  margin-bottom: 9px;
  color: #7b7b7b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dxv-search-result-row a {
  color: #3d3d3d;
  font-size: clamp(24px, 2.6vw, 36px);
  font-weight: 300;
  line-height: 1.12;
  text-decoration: none;
}

.dxv-search-result-row a:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
}

.dxv-search-result-row p {
  max-width: 74ch;
  margin: 12px 0 0;
  color: #666666;
  font-size: 15px;
  line-height: 1.65;
}

.dxv-search-result-row small {
  align-self: start;
  color: #6f6f6f;
  font-size: 14px;
  white-space: nowrap;
}

.dxv-search-empty {
  padding-top: 0;
}

.dxv-search-empty h2 {
  max-width: 760px;
  margin: 0;
  color: #424242;
  font-size: clamp(30px, 3vw, 40px);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.18;
}

.dxv-search-discovery {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(220px, 0.9fr) minmax(260px, 0.9fr);
  gap: clamp(42px, 10vw, 174px);
  margin-top: 92px;
  padding-left: 8px;
}

.dxv-search-discovery h3,
.dxv-search-support > div > p {
  margin: 0 0 34px;
  color: #777777;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.dxv-search-discovery ul {
  display: grid;
  gap: 18px;
  margin: 0;
  padding-left: 19px;
  color: #767676;
  font-size: 16px;
  line-height: 1.35;
}

.dxv-search-discovery nav {
  display: grid;
  gap: 10px;
}

.dxv-search-discovery a {
  color: #444444;
  font-size: clamp(24px, 2.2vw, 31px);
  font-weight: 300;
  line-height: 1.08;
  text-decoration: none;
  transition:
    color 180ms ease,
    transform 180ms ease;
}

.dxv-search-discovery a:hover {
  color: #1d1d1d;
  transform: translateX(3px);
}

.dxv-search-support {
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1fr);
  gap: clamp(48px, 10vw, 176px);
  padding: 72px max(64px, calc((100vw - 1380px) / 2 + 32px)) 78px;
  background: #4a4a49;
  color: #ffffff;
}

.dxv-search-support > div > p {
  color: rgba(255, 255, 255, 0.74);
  margin: 0;
  font-size: 15px;
}

.dxv-search-support h2 {
  margin: 28px 0 0;
  color: #ffffff;
  font-size: clamp(44px, 5vw, 64px);
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1.13;
}

.dxv-search-support-list {
  display: grid;
}

.dxv-search-support-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, auto);
  gap: 28px;
  padding: 0 0 44px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.28);
}

.dxv-search-support-list article + article {
  padding-top: 44px;
}

.dxv-search-support-list article:last-child {
  border-bottom: 0;
}

.dxv-search-support-list h3 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(31px, 3vw, 42px);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.dxv-search-support-list p {
  max-width: 450px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.75);
  font-size: 16px;
  line-height: 1.45;
  white-space: pre-line;
}

.dxv-search-support-list strong {
  align-self: end;
  color: #ffffff;
  font-size: 22px;
  line-height: 1.2;
}

.dxv-search-support-list nav {
  display: grid;
  gap: 16px;
  align-self: start;
}

.dxv-search-support-list nav a {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.dxv-search-support-list nav a:hover {
  color: rgba(255, 255, 255, 0.76);
}

@media (max-width: 900px) {
  .dxv-search-page {
    padding: 0;
  }

  .dxv-search-breadcrumb,
  .dxv-search-hero,
  .dxv-search-results-shell {
    width: min(100% - 40px, 1380px);
  }

  .dxv-search-breadcrumb {
    padding-top: 116px;
  }

  .dxv-search-page-form {
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: none;
  }

  .dxv-search-page-form button {
    justify-self: start;
  }

  .dxv-search-discovery,
  .dxv-search-support,
  .dxv-search-support-list article,
  .dxv-search-result-row {
    grid-template-columns: 1fr;
  }

  .dxv-search-discovery {
    gap: 38px;
    margin-top: 52px;
    padding-left: 0;
  }

  .dxv-search-support {
    gap: 40px;
    padding: 52px 20px 62px;
  }

  .dxv-search-support h2 {
    font-size: clamp(40px, 12vw, 56px);
  }
}

@media (max-width: 560px) {
  .dxv-search-hero {
    margin-top: 26px;
  }

  .dxv-search-page-form input {
    font-size: 24px;
  }

  .dxv-search-empty h2 {
    font-size: 29px;
  }

  .dxv-search-discovery a {
    font-size: 24px;
  }

  .dxv-search-results-shell {
    padding-bottom: 72px;
  }
}
</style>
