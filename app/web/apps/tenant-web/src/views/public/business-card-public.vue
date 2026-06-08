<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Button, Skeleton } from 'ant-design-vue'

import { renderPublicBusinessCardApi } from '#/api'

const route = useRoute()
const loading = ref(false)
const result = ref<PublicEntryBusinessCardApi.PublicRenderResult | null>(null)
const businessCardId = computed(() => String(route.params.businessCardId ?? ''))
const view = computed(() => result.value?.view)

// loadPublicCard reads the anonymous public BusinessCard view by opaque card id.
async function loadPublicCard() {
  loading.value = true
  try {
    result.value = await renderPublicBusinessCardApi(businessCardId.value)
  } finally {
    loading.value = false
  }
}

function actionLabel(type: string) {
  return {
    ADD_WECHAT: 'WeChat',
    CALL_PHONE: 'Call',
    OPEN_COMPANY_WEBSITE: 'Website',
    OPEN_WHATSAPP: 'WhatsApp',
    SAVE_VCARD: 'Save vCard',
    SEND_EMAIL: 'Email'
  }[type] ?? type
}

onMounted(loadPublicCard)
</script>

<template>
  <main class="public-card-page">
    <Skeleton v-if="loading" active class="public-card-page__skeleton" />
    <section v-else-if="result?.state !== 'AVAILABLE' || !view" class="public-card-page__unavailable">
      <h1>名片暂不可用</h1>
      <p>该公开名片当前无法展示，请稍后再试。</p>
    </section>
    <section v-else class="public-card">
      <div class="public-card__brand">
        <span>{{ view.company.companyDisplayName }}</span>
      </div>
      <div class="public-card__identity">
        <div class="public-card__photo">
          <img v-if="view.person.officialPhotoUrl" :alt="view.person.displayName" :src="view.person.officialPhotoUrl" />
          <span v-else>{{ view.person.displayName.slice(0, 1) }}</span>
        </div>
        <div>
          <p class="public-card__eyebrow">{{ view.person.englishName || 'Employee Card' }}</p>
          <h1>{{ view.person.displayName }}</h1>
          <p>{{ [view.person.title, view.person.department].filter(Boolean).join(' / ') }}</p>
        </div>
      </div>
      <div class="public-card__actions">
        <Button v-for="action in view.contactActions" :key="action.contactActionType" :href="action.actionUrl || undefined" size="large" type="primary">
          {{ actionLabel(action.contactActionType) }}
        </Button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.public-card-page {
  align-items: center;
  background: #f8fafc;
  color: #111827;
  display: grid;
  min-height: 100dvh;
  padding: 24px;
}
.public-card-page__skeleton,
.public-card,
.public-card-page__unavailable {
  margin: 0 auto;
  max-width: 520px;
  width: 100%;
}
.public-card,
.public-card-page__unavailable {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 18px 48px -28px rgb(15 23 42 / 34%);
  padding: 28px;
}
.public-card__brand {
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 28px;
}
.public-card__identity {
  display: grid;
  gap: 18px;
  grid-template-columns: auto 1fr;
}
.public-card__photo {
  align-items: center;
  background: #134e4a;
  border-radius: 8px;
  color: #fff;
  display: grid;
  font-size: 38px;
  font-weight: 800;
  height: 112px;
  overflow: hidden;
  place-items: center;
  width: 112px;
}
.public-card__photo img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.public-card__eyebrow {
  color: #64748b;
  font-size: 12px;
  margin: 0 0 6px;
}
.public-card h1,
.public-card-page__unavailable h1 {
  font-size: 30px;
  line-height: 1.1;
  margin: 0;
}
.public-card p,
.public-card-page__unavailable p {
  color: #64748b;
  line-height: 1.6;
  margin: 8px 0 0;
}
.public-card__actions {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28px;
}
@media (max-width: 520px) {
  .public-card-page {
    padding: 16px;
  }
  .public-card__identity,
  .public-card__actions {
    grid-template-columns: 1fr;
  }
}
</style>
