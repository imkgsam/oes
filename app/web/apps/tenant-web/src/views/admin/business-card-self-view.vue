<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Empty, QRCode, Skeleton, Space, Tag } from 'ant-design-vue'

import { getOwnBusinessCardPreviewApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const loading = ref(false)
const errorMessage = ref('')
const preview = ref<any>(null)

const card = computed(() => preview.value?.preview?.view)
const publicUrl = computed(() => preview.value?.publicEntryRef?.publicUrl ?? card.value?.publicUrl ?? '')

// loadPreview reads the authenticated employee self-view without accepting employee/card ids.
async function loadPreview() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    preview.value = await getOwnBusinessCardPreviewApi(activeTenantId.value)
  } catch (error) {
    errorMessage.value = (error as Error).message || '我的名片加载失败。'
  } finally {
    loading.value = false
  }
}

onMounted(loadPreview)
</script>

<template>
  <Page title="我的名片">
    <div class="business-card-self">
      <Alert v-if="errorMessage" :message="errorMessage" show-icon type="error" />
      <Skeleton v-if="loading" active />
      <Empty v-else-if="!card" description="暂未找到可预览的员工名片" />
      <section v-else class="business-card-self__panel">
        <div class="business-card-self__identity">
          <div class="business-card-self__avatar">
            <img v-if="card.person.officialPhotoUrl" :alt="card.person.displayName" :src="card.person.officialPhotoUrl" />
            <span v-else>{{ card.person.displayName.slice(0, 1) }}</span>
          </div>
          <div>
            <p class="business-card-self__eyebrow">Employee Digital Business Card</p>
            <h2>{{ card.person.displayName }}</h2>
            <p>{{ [card.person.title, card.person.department].filter(Boolean).join(' / ') }}</p>
            <Tag :color="preview.status === 'ACTIVE' ? 'green' : 'blue'">{{ preview.status }}</Tag>
          </div>
        </div>
        <div class="business-card-self__qr">
          <QRCode v-if="publicUrl" :size="168" :value="publicUrl" />
          <p>{{ publicUrl || '公开入口尚未绑定' }}</p>
        </div>
        <div class="business-card-self__actions">
          <Button v-for="action in card.contactActions" :key="action.contactActionType" :href="action.actionUrl || undefined">
            <template #icon><IconifyIcon icon="lucide:send" /></template>
            {{ action.contactActionType }}
          </Button>
        </div>
        <Space>
          <Button :disabled="!publicUrl" :href="publicUrl" target="_blank">打开公开页</Button>
          <Button @click="loadPreview">刷新</Button>
        </Space>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.business-card-self {
  display: grid;
  gap: 16px;
}
.business-card-self__panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: grid;
  gap: 24px;
  max-width: 920px;
  padding: 24px;
}
.business-card-self__identity {
  align-items: center;
  display: grid;
  gap: 18px;
  grid-template-columns: auto 1fr;
}
.business-card-self__avatar {
  align-items: center;
  background: #0f766e;
  border-radius: 28px;
  color: #fff;
  display: grid;
  font-size: 34px;
  font-weight: 700;
  height: 96px;
  overflow: hidden;
  place-items: center;
  width: 96px;
}
.business-card-self__avatar img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.business-card-self__identity h2 {
  color: #111827;
  font-size: 26px;
  margin: 0;
}
.business-card-self__identity p {
  color: #64748b;
  margin: 4px 0;
}
.business-card-self__eyebrow {
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.business-card-self__qr,
.business-card-self__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .business-card-self__identity {
    grid-template-columns: 1fr;
  }
}
</style>
