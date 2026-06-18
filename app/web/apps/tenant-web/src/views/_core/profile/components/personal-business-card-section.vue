<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'

import { computed, onMounted, ref } from 'vue'

import { IconifyIcon } from '@vben/icons'

import { Button, Card, Dropdown, Empty, Menu, QRCode, Skeleton, Tag } from 'ant-design-vue'

import { getOwnBusinessCardPreviewApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type PublicView = PublicEntryBusinessCardApi.PublicView
type ContactAction = PublicView['contactActions'][number]
type BusinessCardStatus = PublicEntryBusinessCardApi.Status

interface OwnBusinessCardPreview {
  businessCardId?: string
  businessCard?: {
    businessCardId?: string
    status?: string
  }
  preview?: {
    view?: PublicView
  }
  publicEntryRef?: null | PublicEntryBusinessCardApi.PublicEntryRef
  status?: string
  view?: PublicView
}

interface PersonalCardItem {
  actions: ContactAction[]
  businessCardId: string
  publicUrl: string
  status: string
  view: PublicView
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const loading = ref(false)
const errorMessage = ref('')
const previewPayload = ref<unknown>(null)

const cardItems = computed(() => normalizePreviewPayload(previewPayload.value))

// loadPreview reads only the authenticated employee preview endpoint for the active tenant.
async function loadPreview() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    previewPayload.value = null
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    previewPayload.value = await getOwnBusinessCardPreviewApi(activeTenantId.value)
  } catch {
    errorMessage.value = '名片暂时不可用'
    previewPayload.value = null
  } finally {
    loading.value = false
  }
}

// normalizePreviewPayload keeps the UI list-ready while the BFF still returns the current primary card shape.
function normalizePreviewPayload(payload: unknown): PersonalCardItem[] {
  const candidates = extractPreviewCandidates(payload)
  return candidates.map((candidate, index) => {
    const view = candidate.preview?.view ?? candidate.view
    if (!view) return null
    const publicUrl = candidate.publicEntryRef?.publicUrl ?? view.publicUrl ?? ''
    return {
      actions: [...(view.contactActions ?? [])].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0)),
      businessCardId: view.businessCardId || candidate.businessCard?.businessCardId || candidate.businessCardId || `self-card-${index}`,
      publicUrl,
      status: candidate.status || candidate.businessCard?.status || 'DRAFT',
      view
    }
  }).filter((item): item is PersonalCardItem => Boolean(item))
}

// extractPreviewCandidates accepts future multi-card envelopes without changing the rendered component contract.
function extractPreviewCandidates(payload: unknown): OwnBusinessCardPreview[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as OwnBusinessCardPreview[]
  const envelope = payload as {
    cards?: OwnBusinessCardPreview[]
    items?: OwnBusinessCardPreview[]
    previews?: OwnBusinessCardPreview[]
  }
  if (Array.isArray(envelope.cards)) return envelope.cards
  if (Array.isArray(envelope.items)) return envelope.items
  if (Array.isArray(envelope.previews)) return envelope.previews
  return [payload as OwnBusinessCardPreview]
}

function statusColor(status?: string) {
  const normalized = normalizeStatus(status)
  return normalized === 'ACTIVE' ? 'green' : normalized === 'DISABLED' ? 'orange' : normalized === 'ARCHIVED' ? 'default' : 'blue'
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status)
  const labels: Record<BusinessCardStatus, string> = {
    ACTIVE: '已启用',
    ARCHIVED: '已归档',
    DISABLED: '已禁用',
    DRAFT: '草稿'
  }
  return normalized ? labels[normalized] : (status || '未知')
}

function normalizeStatus(status?: string): BusinessCardStatus | undefined {
  const normalized = ({ '1': 'DRAFT', '2': 'ACTIVE', '3': 'DISABLED', '4': 'ARCHIVED' } as Record<string, BusinessCardStatus>)[status ?? ''] ?? status
  return normalized === 'ACTIVE' || normalized === 'ARCHIVED' || normalized === 'DISABLED' || normalized === 'DRAFT'
    ? normalized
    : undefined
}

function actionLabel(actionType: PublicEntryBusinessCardApi.ActionType) {
  return {
    ADD_WECHAT: '添加微信',
    CALL_PHONE: '拨打电话',
    OPEN_COMPANY_WEBSITE: '访问官网',
    OPEN_WHATSAPP: '打开 WhatsApp',
    SAVE_VCARD: '保存通讯录',
    SEND_EMAIL: '发送邮件'
  }[actionType] ?? '联系'
}

function actionIcon(actionType: PublicEntryBusinessCardApi.ActionType) {
  return {
    ADD_WECHAT: 'lucide:message-circle',
    CALL_PHONE: 'lucide:phone',
    OPEN_COMPANY_WEBSITE: 'lucide:building-2',
    OPEN_WHATSAPP: 'lucide:messages-square',
    SAVE_VCARD: 'lucide:contact',
    SEND_EMAIL: 'lucide:mail'
  }[actionType] ?? 'lucide:send'
}

function personMeta(view: PublicView) {
  return [view.person.title, view.person.department, view.company?.companyDisplayName].filter(Boolean).join(' · ')
}

// officialPhotoPlaceholder renders a formal fallback mark without reading account avatar data.
function officialPhotoPlaceholder(displayName?: string) {
  const normalized = displayName?.trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '职'
}

// shortPublicUrl presents the entry as card copy while keeping the link target unchanged.
function shortPublicUrl(publicUrl: string) {
  if (!publicUrl) return ''
  try {
    const url = new URL(publicUrl)
    return url.pathname || publicUrl
  } catch {
    return publicUrl.replace(/^https?:\/\/[^/]+/i, '') || publicUrl
  }
}

// hasOperations keeps the formal card surface focused on identity while still exposing card actions.
function hasOperations(card: PersonalCardItem) {
  return card.actions.length > 0 || Boolean(card.publicUrl)
}

onMounted(loadPreview)
</script>

<template>
  <Card :bordered="false" class="personal-business-card-section">
    <div class="personal-business-card-section__head">
      <div>
        <div class="section-title">我的名片</div>
      </div>
    </div>

    <Skeleton v-if="loading" active :paragraph="{ rows: 4 }" />
    <div v-else-if="errorMessage" class="personal-business-card-section__unavailable">
      <strong>{{ errorMessage }}</strong>
      <span>稍后重试</span>
    </div>
    <Empty v-else-if="cardItems.length === 0" description="当前账号暂无可查看的员工名片" />

    <div v-else class="personal-business-card-section__list">
      <article
        v-for="card in cardItems"
        :key="card.businessCardId"
        class="personal-business-card-section__item personal-business-card-section__mini-card personal-business-card-section__mini-card--compact"
      >
        <div class="personal-business-card-section__visual">
          <span class="personal-business-card-section__motion-sheen" aria-hidden="true"></span>
          <span class="personal-business-card-section__ambient-ring" aria-hidden="true"></span>
          <div class="personal-business-card-section__brand-strip">
            <span>{{ card.view.company?.companyDisplayName || 'Business Card' }}</span>
          </div>

          <Dropdown
            v-if="hasOperations(card)"
            overlay-class-name="personal-business-card-section__dropdown"
            placement="bottomRight"
            trigger="click"
          >
            <Button
              aria-label="名片操作"
              class="personal-business-card-section__menu-trigger"
              title="名片操作"
              type="text"
            >
              <template #icon><IconifyIcon icon="lucide:more-horizontal" /></template>
            </Button>
            <template #overlay>
              <Menu class="personal-business-card-section__menu">
                <Menu.Item
                  v-for="action in card.actions"
                  :key="`${card.businessCardId}-${action.contactActionType}`"
                  :disabled="!action.actionUrl"
                >
                  <a
                    v-if="action.actionUrl"
                    :href="action.actionUrl"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <IconifyIcon :icon="actionIcon(action.contactActionType)" />
                    <span>{{ actionLabel(action.contactActionType) }}</span>
                  </a>
                  <span v-else>
                    <IconifyIcon :icon="actionIcon(action.contactActionType)" />
                    <span>{{ actionLabel(action.contactActionType) }}</span>
                  </span>
                </Menu.Item>
                <Menu.Item v-if="card.publicUrl" :key="`${card.businessCardId}-preview`">
                  <a :href="card.publicUrl" rel="noreferrer" target="_blank">
                    <IconifyIcon icon="lucide:external-link" />
                    <span>预览名片</span>
                  </a>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>

          <div class="personal-business-card-section__identity">
            <div class="personal-business-card-section__avatar">
              <img
                v-if="card.view.person.officialPhotoUrl"
                :alt="card.view.person.displayName"
                :src="card.view.person.officialPhotoUrl"
              >
              <span v-else>{{ officialPhotoPlaceholder(card.view.person.displayName) }}</span>
            </div>
            <div class="personal-business-card-section__person">
              <div class="personal-business-card-section__name-row">
                <h3>{{ card.view.person.displayName }}</h3>
                <Tag :color="statusColor(card.status)">{{ statusLabel(card.status) }}</Tag>
              </div>
              <p>{{ personMeta(card.view) || '员工名片' }}</p>
            </div>
          </div>

          <div class="personal-business-card-section__entry">
            <a
              v-if="card.publicUrl"
              class="personal-business-card-section__entry-link"
              :href="card.publicUrl"
              rel="noreferrer"
              target="_blank"
            >
              <IconifyIcon icon="lucide:scan-line" />
              <span>公开入口</span>
              <strong>{{ shortPublicUrl(card.publicUrl) }}</strong>
            </a>
            <span v-else class="personal-business-card-section__entry-link">
              <IconifyIcon icon="lucide:scan-line" />
              <span>公开入口尚未生成</span>
            </span>
            <div v-if="card.publicUrl" class="personal-business-card-section__qr-tile">
              <QRCode :size="56" :value="card.publicUrl" />
            </div>
          </div>
        </div>
      </article>
    </div>
  </Card>
</template>

<style scoped>
.personal-business-card-section {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.05);
}

.personal-business-card-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 600;
}

.personal-business-card-section__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 306px), 356px));
  gap: 14px;
  margin-top: 14px;
}

.personal-business-card-section__item {
  position: relative;
}

.personal-business-card-section__mini-card {
  min-height: 214px;
  overflow: hidden;
  border: 1px solid rgb(203 213 225 / 0.96);
  border-radius: 8px;
  background:
    linear-gradient(112deg, rgb(255 255 255 / 0.94), rgb(248 250 252 / 0.96) 54%, rgb(232 240 246 / 0.9)),
    #ffffff;
  box-shadow: 0 16px 32px -26px rgb(15 23 42 / 0.42);
  transform: translateZ(0);
  transition:
    border-color 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__mini-card:hover {
  border-color: rgb(148 163 184 / 0.86);
  box-shadow: 0 22px 42px -30px rgb(15 23 42 / 0.46);
  transform: translateY(-2px);
}

.personal-business-card-section__mini-card::before {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(148 163 184 / 0.10) 0 1px, transparent 1px 100%),
    linear-gradient(0deg, rgb(148 163 184 / 0.08) 0 1px, transparent 1px 100%);
  background-size: 24px 24px;
  mask-image: linear-gradient(135deg, rgb(0 0 0 / 0.36), transparent 64%);
  pointer-events: none;
  content: '';
}

.personal-business-card-section__mini-card::after {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: 76px;
  height: 76px;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 999px;
  opacity: 0.42;
  pointer-events: none;
  content: '';
}

.personal-business-card-section__visual {
  display: grid;
  position: relative;
  min-height: 214px;
  align-content: space-between;
  gap: 10px;
  padding: 14px;
}

.personal-business-card-section__motion-sheen {
  position: absolute;
  inset: -40% auto -35% -62%;
  width: 58%;
  background: linear-gradient(105deg, transparent, rgb(255 255 255 / 0.82), transparent);
  opacity: 0;
  pointer-events: none;
  transform: translateX(0) skewX(-18deg);
  transition:
    opacity 0.26s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.62s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__ambient-ring {
  position: absolute;
  right: 64px;
  bottom: 28px;
  width: 86px;
  height: 86px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  opacity: 0.38;
  pointer-events: none;
  transform: scale(1);
  transition:
    opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__mini-card:hover .personal-business-card-section__motion-sheen {
  opacity: 1;
  transform: translateX(310%) skewX(-18deg);
}

.personal-business-card-section__mini-card:hover .personal-business-card-section__ambient-ring {
  opacity: 0.58;
  transform: scale(1.08);
}

.personal-business-card-section__brand-strip {
  display: flex;
  align-items: center;
  max-width: calc(100% - 54px);
  min-height: 24px;
}

.personal-business-card-section__brand-strip span {
  display: inline-block;
  max-width: 100%;
  color: rgb(71 85 105 / 0.82);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.personal-business-card-section__identity {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: end;
  gap: 15px;
  min-width: 0;
}

.personal-business-card-section__avatar {
  display: grid;
  width: 82px;
  height: 98px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgb(203 213 225 / 0.96);
  background:
    linear-gradient(145deg, #f8fafc, #e2edf6),
    #f8fafc;
  color: #2f5f73;
  box-shadow: 0 14px 28px -22px rgb(15 23 42 / 0.52);
  font-size: 30px;
  font-weight: 700;
  transition:
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__mini-card:hover .personal-business-card-section__avatar {
  box-shadow: 0 18px 34px -24px rgb(15 23 42 / 0.58);
  transform: translateY(-2px);
}

.personal-business-card-section__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.personal-business-card-section__person {
  min-width: 0;
}

.personal-business-card-section__name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.personal-business-card-section__name-row h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
}

.personal-business-card-section__name-row :deep(.ant-tag) {
  margin-inline-end: 0;
  border-color: rgb(203 213 225 / 0.86);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.88);
  color: #475569;
  font-size: 11px;
  line-height: 20px;
}

.personal-business-card-section__identity p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.personal-business-card-section__menu-trigger {
  display: inline-flex;
  position: absolute;
  top: 14px;
  right: 14px;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgb(203 213 225 / 0.88);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.74);
  color: #334155;
  font-size: 18px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.72),
    0 10px 22px -18px rgb(15 23 42 / 0.52);
  transition:
    background 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__menu-trigger:hover {
  border-color: rgb(148 163 184 / 0.92);
  background: #fff;
  transform: translateY(-1px);
}

.personal-business-card-section__menu-trigger:active {
  transform: translateY(0) scale(0.98);
}

.personal-business-card-section__menu {
  min-width: 176px;
  padding: 8px;
}

:global(.personal-business-card-section__dropdown .ant-dropdown-menu) {
  border: 1px solid rgb(148 163 184 / 0.18);
  border-radius: 8px;
  box-shadow: 0 18px 40px -24px rgb(15 23 42 / 0.34);
}

.personal-business-card-section__menu a,
.personal-business-card-section__menu span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 32px;
  color: hsl(var(--foreground));
  font-size: 13px;
}

.personal-business-card-section__entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  border-top: 1px solid rgb(226 232 240 / 0.88);
  padding-top: 10px;
}

.personal-business-card-section__entry-link {
  display: inline-grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
  border: 1px solid rgb(226 232 240 / 0.96);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.72);
  padding: 7px 10px;
  color: #475569;
  font-size: 12px;
  text-decoration: none;
  transition:
    background 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__entry-link:hover {
  border-color: rgb(203 213 225 / 0.98);
  background: #fff;
  color: #0f172a;
  transform: translateY(-1px);
}

.personal-business-card-section__entry-link strong {
  min-width: 0;
  color: #0f172a;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.personal-business-card-section__qr-tile {
  display: grid;
  flex: 0 0 auto;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.96);
  box-shadow: 0 10px 24px -20px rgb(15 23 42 / 0.58);
  transition:
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.personal-business-card-section__mini-card:hover .personal-business-card-section__qr-tile {
  box-shadow: 0 14px 26px -20px rgb(15 23 42 / 0.62);
  transform: translateY(-2px);
}

.personal-business-card-section__unavailable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 0.35);
  padding: 12px;
}

.personal-business-card-section__unavailable strong {
  color: hsl(var(--foreground));
}

.personal-business-card-section__unavailable span {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

@media (max-width: 840px) {
  .personal-business-card-section__head {
    grid-template-columns: 1fr;
  }

  .personal-business-card-section__head {
    display: grid;
  }
}

@media (max-width: 560px) {
  .personal-business-card-section__identity {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 12px;
  }

  .personal-business-card-section__avatar {
    width: 82px;
    height: 96px;
  }

  .personal-business-card-section__entry {
    align-items: flex-end;
  }

  .personal-business-card-section__entry-link {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .personal-business-card-section__entry-link span {
    display: none;
  }
}
</style>
