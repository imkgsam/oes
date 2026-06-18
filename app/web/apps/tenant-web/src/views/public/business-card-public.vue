<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { IconifyIcon } from '@vben/icons'

import { QRCode, Skeleton } from 'ant-design-vue'

import { renderPublicBusinessCardApi } from '#/api'

const route = useRoute()
const loading = ref(false)
const result = ref<PublicEntryBusinessCardApi.PublicRenderResult | null>(null)
const businessCardId = computed(() => String(route.params.businessCardId ?? ''))
const view = computed(() => result.value?.view)
const sortedActions = computed(() => {
  return [...(view.value?.contactActions ?? [])]
    .filter((action) => action.actionUrl || action.contactActionType === 'SAVE_VCARD')
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
})
const publicQrValue = computed(() =>
  view.value?.publicUrl || `/public/business-cards/${businessCardId.value}`
)
const personMeta = computed(() =>
  [view.value?.person.title, view.value?.person.department].filter(Boolean).join(' / ')
)
// officialPhotoBackgroundStyle promotes the HR-owned employee photo into the public card portrait background.
const officialPhotoBackgroundStyle = computed(() => {
  const photoUrl = view.value?.person.officialPhotoUrl
  return photoUrl ? { backgroundImage: `url("${photoUrl}")` } : undefined
})

// loadPublicCard reads the anonymous public BusinessCard view by opaque card id.
async function loadPublicCard() {
  loading.value = true
  try {
    result.value = await renderPublicBusinessCardApi(businessCardId.value)
  } finally {
    loading.value = false
  }
}

// actionLabel maps public action types into customer-facing labels on the public card.
function actionLabel(type: string) {
  return {
    ADD_WECHAT: '微信',
    CALL_PHONE: '电话',
    OPEN_COMPANY_WEBSITE: '官网',
    OPEN_WHATSAPP: 'WhatsApp',
    SAVE_VCARD: '保存通讯录',
    SEND_EMAIL: '邮箱'
  }[type] ?? type
}

// actionIcon gives each public contact row a compact visual anchor.
function actionIcon(type: string) {
  return {
    ADD_WECHAT: 'lucide:message-circle',
    CALL_PHONE: 'lucide:phone',
    OPEN_COMPANY_WEBSITE: 'lucide:building-2',
    OPEN_WHATSAPP: 'lucide:messages-square',
    SAVE_VCARD: 'lucide:contact',
    SEND_EMAIL: 'lucide:mail'
  }[type] ?? 'lucide:send'
}

// actionDisplayValue prefers service-owned display values and falls back to readable URLs.
function actionDisplayValue(action: PublicEntryBusinessCardApi.PublicView['contactActions'][number]) {
  if (action.contactActionType === 'SAVE_VCARD') return action.displayValue || '下载标准 vCard'
  if (action.displayValue) return action.displayValue
  const url = action.actionUrl ?? ''
  return url
    .replace(/^mailto:/, '')
    .replace(/^tel:/, '')
    .replace(/^https?:\/\//, '')
}

// officialPhotoPlaceholder renders a formal fallback mark without reading account avatar data.
function officialPhotoPlaceholder(displayName?: string) {
  const normalized = displayName?.trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '职'
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
      <div
        class="public-card__portrait"
        :class="{ 'public-card__portrait--photo-background': view.person.officialPhotoUrl }"
        :style="officialPhotoBackgroundStyle"
      >
        <div
          v-if="!view.person.officialPhotoUrl"
          class="public-card__photo public-card__photo--placeholder"
        >
          <span>{{ officialPhotoPlaceholder(view.person.displayName) }}</span>
        </div>
      </div>

      <div class="public-card__panel public-card__panel--angled">
        <div class="public-card__ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="public-card__name-grid">
          <div>
            <p class="public-card__eyebrow">{{ view.person.englishName || 'Business Card' }}</p>
            <h1>{{ view.person.displayName }}</h1>
          </div>
          <div class="public-card__role">
            <strong>{{ view.company.companyDisplayName }}</strong>
            <span>{{ personMeta || '员工数字名片' }}</span>
          </div>
        </div>

        <div class="public-card__contact-list">
          <a
            v-for="action in sortedActions"
            :key="`${action.contactActionType}-${action.displayOrder}`"
            class="public-card__contact-row"
            :href="action.actionUrl"
            rel="noreferrer"
            target="_blank"
          >
            <IconifyIcon :icon="actionIcon(action.contactActionType)" />
            <span>{{ actionLabel(action.contactActionType) }}</span>
            <strong>{{ actionDisplayValue(action) }}</strong>
          </a>
        </div>

        <div class="public-card__footer">
          <div>
            <strong>扫码查看最新名片</strong>
            <span>保存通讯录后，可快速找到联系方式。</span>
          </div>
          <div class="public-card__qr-shell">
            <QRCode :size="86" :value="publicQrValue" />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.public-card-page {
  align-items: center;
  background:
    radial-gradient(circle at 18% 16%, rgb(15 118 110 / 0.10), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  color: #111827;
  display: grid;
  min-height: 100dvh;
  padding: 28px;
}
.public-card-page__skeleton,
.public-card,
.public-card-page__unavailable {
  margin: 0 auto;
  max-width: 560px;
  width: 100%;
}
.public-card,
.public-card-page__unavailable {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 26px 70px -38px rgb(15 23 42 / 46%);
}
.public-card {
  display: grid;
  overflow: hidden;
  padding: 0;
}
.public-card__portrait {
  position: relative;
  display: grid;
  min-height: 346px;
  place-items: end center;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(241 245 249 / 0.96)),
    #f8fafc;
  padding: 42px 36px 0;
}
.public-card__portrait--photo-background {
  min-height: 362px;
  place-items: center;
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
}
.public-card__portrait--photo-background::before {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgb(241 248 255 / 0.24) 0%, rgb(11 31 62 / 0.10) 70%, rgb(11 31 62 / 0.34) 100%),
    linear-gradient(90deg, rgb(255 255 255 / 0.12), transparent 32%, rgb(255 255 255 / 0.18));
  content: '';
}
.public-card__photo {
  display: grid;
  width: min(320px, 74vw);
  height: 300px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f766e, #115e59);
  color: #fff;
  font-size: 76px;
  font-weight: 800;
  box-shadow: 0 24px 54px -34px rgb(15 23 42 / 0.7);
}
.public-card__photo--placeholder {
  width: 184px;
  height: 184px;
  margin-bottom: 56px;
  border: 1px solid rgb(255 255 255 / 0.74);
  border-radius: 8px;
  font-size: 68px;
  box-shadow: 0 22px 44px -30px rgb(15 23 42 / 0.82);
}
.public-card__panel {
  position: relative;
  margin-top: -38px;
  background:
    linear-gradient(145deg, rgb(39 89 165 / 0.92) 0%, rgb(32 67 136 / 0.98) 42%, #142c66 100%),
    #1f4387;
  color: #fff;
  clip-path: polygon(0 38px, 100% 0, 100% 100%, 0 100%);
  padding: 78px 44px 34px;
}
.public-card__panel::before {
  position: absolute;
  top: 34px;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.30) 24%, rgb(255 255 255 / 0.08) 100%);
  content: '';
  transform: rotate(-3.6deg);
  transform-origin: right center;
}
.public-card__panel::after {
  position: absolute;
  inset: 38px 0 auto;
  height: 92px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent);
  content: '';
  pointer-events: none;
}
.public-card__ornament {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 7px;
  margin-bottom: 22px;
}
.public-card__ornament span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.86);
}
.public-card__name-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(170px, 0.9fr);
  gap: 26px;
  align-items: center;
}
.public-card__name-grid > div:first-child {
  border-right: 1px dotted rgb(255 255 255 / 0.48);
  padding-right: 26px;
}
.public-card__eyebrow {
  color: rgb(255 255 255 / 0.78);
  font-size: 12px;
  margin: 0 0 6px;
}
.public-card h1,
.public-card-page__unavailable h1 {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.05;
  margin: 0;
}
.public-card__role {
  display: grid;
  gap: 8px;
}
.public-card__role strong {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
}
.public-card__role span {
  color: rgb(255 255 255 / 0.82);
  font-size: 14px;
  line-height: 1.55;
}
.public-card p,
.public-card-page__unavailable p {
  color: #64748b;
  line-height: 1.6;
  margin: 8px 0 0;
}
.public-card__contact-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  margin-top: 28px;
}
.public-card__contact-row {
  display: grid;
  grid-template-columns: 24px 74px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  color: #fff;
  min-height: 28px;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.public-card__contact-row:hover {
  opacity: 0.88;
  transform: translateX(2px);
}
.public-card__contact-row > span {
  color: rgb(255 255 255 / 0.74);
  font-size: 13px;
}
.public-card__contact-row strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 500;
}
.public-card__footer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 18px;
  margin-top: 26px;
  border-top: 1px dotted rgb(255 255 255 / 0.42);
  padding-top: 22px;
}
.public-card__footer > div {
  display: grid;
  gap: 8px;
}
.public-card__footer strong {
  font-size: 18px;
}
.public-card__footer span {
  color: rgb(255 255 255 / 0.76);
  font-size: 13px;
  line-height: 1.6;
}
.public-card__qr-shell {
  display: grid;
  width: 102px;
  height: 102px;
  place-items: center;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 28px rgb(10 20 46 / 0.18);
}
.public-card-page__unavailable {
  padding: 28px;
}
@media (max-width: 520px) {
  .public-card-page {
    padding: 16px;
  }
  .public-card__portrait {
    min-height: 280px;
    padding: 44px 22px 0;
  }
  .public-card__photo {
    height: 252px;
  }
  .public-card__photo--placeholder {
    width: 156px;
    height: 156px;
    margin-bottom: 50px;
  }
  .public-card__panel {
    margin-top: -34px;
    clip-path: polygon(0 34px, 100% 0, 100% 100%, 0 100%);
    padding: 72px 26px 28px;
  }
  .public-card__name-grid,
  .public-card__footer {
    grid-template-columns: 1fr;
  }
  .public-card__name-grid > div:first-child {
    border-right: 0;
    border-bottom: 1px dotted rgb(255 255 255 / 0.42);
    padding-right: 0;
    padding-bottom: 18px;
  }
  .public-card h1 {
    font-size: 36px;
  }
  .public-card__contact-row {
    grid-template-columns: 22px 62px minmax(0, 1fr);
  }
}
</style>
