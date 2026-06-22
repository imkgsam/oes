<script lang="ts">
type ShortLinkFetch = (
  input: string,
  init: { headers: { Accept: string } }
) => Promise<Pick<Response, 'headers' | 'redirected' | 'status' | 'url'>>

// resolveShortLinkRedirectUrl delegates ShortLink ownership to the gateway and returns its resolved public target.
export async function resolveShortLinkRedirectUrl(
  shortCode: string,
  fetcher: ShortLinkFetch = fetch
) {
  const response = await fetcher(`/c/${encodeURIComponent(shortCode)}`, {
    headers: { Accept: '*/*' }
  })
  if (response.redirected && response.url) return response.url
  if (response.status >= 300 && response.status < 400) {
    return response.headers.get('location') || null
  }
  return null
}
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const resolving = ref(true)

// resolveCurrentShortLink handles dev-server SPA fallback for root public ShortLink navigations.
async function resolveCurrentShortLink() {
  resolving.value = true
  try {
    const targetUrl = await resolveShortLinkRedirectUrl(String(route.params.shortCode ?? ''))
    if (targetUrl) {
      window.location.replace(targetUrl)
      return
    }
    await router.replace({
      name: 'FallbackNotFound',
      params: { path: ['404'] }
    })
  } finally {
    resolving.value = false
  }
}

onMounted(resolveCurrentShortLink)
</script>

<template>
  <main class="public-short-link-redirect">
    <span v-if="resolving">正在打开公开链接</span>
  </main>
</template>

<style scoped>
.public-short-link-redirect {
  align-items: center;
  background: #f8fafc;
  color: #475569;
  display: grid;
  min-height: 100dvh;
  place-items: center;
}
</style>
