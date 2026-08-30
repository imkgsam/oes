<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { IconifyIcon } from '@vben/icons'

import { QRCode, Skeleton } from 'ant-design-vue'

import { renderPublicBusinessCardApi } from '#/api'

const route = useRoute()
const loading = ref(false)
const result = ref<null | PublicEntryBusinessCardApi.PublicRenderResult>(null)
const businessCardId = computed(() => String(route.params.businessCardId ?? ''))
const view = computed(() => result.value?.view)
const publicState = computed(() => result.value?.state)
const publicStateContent = computed(() => {
  if (publicState.value === 'PUBLIC_CARD_NOT_FOUND') {
    return {
      description: '该公开名片不存在或链接已失效。',
      title: '名片不存在'
    }
  }
  return {
    description: '该公开名片当前无法展示，请稍后再试。',
    title: '名片暂不可用'
  }
})
const sortedActions = computed(() => {
  return (view.value?.contactActions ?? [])
    .filter((action) => action.actionUrl || action.contactActionType === 'SAVE_VCARD')
    .toSorted((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
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
    const nextResult = await renderPublicBusinessCardApi(businessCardId.value)
    result.value = nextResult
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

// isCompactContactAction identifies system actions that should render as a single concise command.
function isCompactContactAction(type: string) {
  return type === 'SAVE_VCARD'
}

// actionDisplayValue prefers service-owned display values and falls back to readable URLs.
function actionDisplayValue(action: PublicEntryBusinessCardApi.PublicView['contactActions'][number]) {
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
    <section v-else-if="view" class="public-card">
      <div class="public-card__qr-shell">
        <QRCode :bordered="false" :size="72" :value="publicQrValue" />
      </div>
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
        <div class="public-card__content-grid">
          <div class="public-card__identity">
            <h1>{{ view.person.displayName }}</h1>
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
              :class="{ 'public-card__contact-row--compact': isCompactContactAction(action.contactActionType) }"
              :href="action.actionUrl"
              rel="noreferrer"
              target="_blank"
            >
              <IconifyIcon :icon="actionIcon(action.contactActionType)" />
              <span>{{ actionLabel(action.contactActionType) }}</span>
              <strong v-if="!isCompactContactAction(action.contactActionType)">
                {{ actionDisplayValue(action) }}
              </strong>
            </a>
          </div>
        </div>
      </div>
    </section>
    <section
      v-else-if="publicState"
      class="public-card-status"
      :data-public-card-state="publicState"
      role="status"
    >
      <div class="public-card-status__mark" aria-hidden="true">名</div>
      <h1>{{ publicStateContent.title }}</h1>
      <p>{{ publicStateContent.description }}</p>
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
.public-card-status {
  margin: 0 auto;
  max-width: 500px;
  width: 100%;
}
.public-card-status {
  display: grid;
  justify-items: center;
  gap: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 26px 70px -38px rgb(15 23 42 / 46%);
  padding: 64px 36px;
  text-align: center;
}
.public-card-status__mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f766e, #115e59);
  color: #fff;
  font-size: 28px;
  font-weight: 800;
}
.public-card-status h1 {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 700;
}
.public-card-status p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}
.public-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 26px 70px -38px rgb(15 23 42 / 46%);
  position: relative;
}
.public-card {
  display: grid;
  overflow: hidden;
  padding: 0;
}
.public-card__portrait {
  position: relative;
  display: grid;
  min-height: 328px;
  place-items: end center;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(241 245 249 / 0.96)),
    #f8fafc;
  padding: 42px 36px 0;
}
.public-card__portrait--photo-background {
  min-height: 340px;
  place-items: center;
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
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
  margin-top: -16px;
  min-height: 218px;
  background:
    linear-gradient(145deg, rgb(39 89 165 / 0.92) 0%, rgb(32 67 136 / 0.98) 42%, #142c66 100%),
    #1f4387;
  color: #fff;
  clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%);
  padding: 58px 36px 44px;
}
.public-card__panel::before {
  position: absolute;
  top: 14px;
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
  inset: 16px 0 auto;
  height: 92px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent);
  content: '';
  pointer-events: none;
}
.public-card__content-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
  gap: 20px;
  align-items: start;
}
.public-card__identity {
  display: grid;
  gap: 12px;
  min-width: 0;
  border-right: 1px dotted rgb(255 255 255 / 0.48);
  padding-right: 10px;
}
.public-card h1 {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.12;
  margin: 0;
}
.public-card__role {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.public-card__role strong {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.public-card__role span {
  color: rgb(255 255 255 / 0.82);
  font-size: 13px;
  line-height: 1.55;
}
.public-card p {
  color: #64748b;
  line-height: 1.6;
  margin: 8px 0 0;
}
.public-card__contact-list {
  display: grid;
  gap: 10px;
  min-width: 0;
}
.public-card__contact-row {
  display: grid;
  grid-template-columns: 18px 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: #fff;
  min-height: 28px;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.public-card__contact-row:hover {
  opacity: 0.88;
  transform: translateX(2px);
}
.public-card__contact-row--compact {
  grid-template-columns: 18px minmax(0, 1fr);
}
.public-card__contact-row > span {
  color: rgb(255 255 255 / 0.74);
  font-size: 12px;
}
.public-card__contact-row--compact > span {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.public-card__contact-row strong {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.public-card__qr-shell {
  display: grid;
  position: absolute;
  right: 18px;
  top: 18px;
  z-index: 2;
  justify-self: end;
  place-items: center;
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
    margin-top: -16px;
    min-height: 228px;
    clip-path: polygon(0 16px, 100% 0, 100% 100%, 0 100%);
    padding: 64px 26px 38px;
  }
  .public-card__content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .public-card__identity {
    border-right: 0;
    border-bottom: 1px dotted rgb(255 255 255 / 0.42);
    padding-right: 0;
    padding-bottom: 18px;
  }
  .public-card__qr-shell {
    right: 14px;
    top: 14px;
  }
  .public-card h1 {
    font-size: 24px;
  }
  .public-card__contact-row {
    grid-template-columns: 22px 64px minmax(0, 1fr);
  }
  .public-card__contact-row--compact {
    grid-template-columns: 22px minmax(0, 1fr);
  }
}
</style>
