<script setup lang="ts">
import type { PublicEntryBusinessCardApi } from '#/api'

import { computed, onMounted, ref, watch } from 'vue'

import { QRCode, Skeleton, Tag } from 'ant-design-vue'

import { listBusinessCardsApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type BusinessCardRecord = PublicEntryBusinessCardApi.BusinessCardRecord
type BusinessCardStatus = PublicEntryBusinessCardApi.Status

interface EmployeeContext {
  department?: string
  displayName?: string
  employeeCode?: string
  employeeId: string
  officialPhotoAssetId?: null | string
  officialPhotoUrl?: null | string
}

const props = defineProps<{
  employeeContext: EmployeeContext
}>()

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const loading = ref(false)
const errorMessage = ref('')
const cards = ref<BusinessCardRecord[]>([])
const officialPhotoUrl = ref<null | string>(null)

const employeeCards = computed(() =>
  cards.value.filter((card) => card.employeeId === props.employeeContext.employeeId)
)
const primaryCard = computed(() => employeeCards.value[0])
const employeeName = computed(() => props.employeeContext.displayName?.trim() || props.employeeContext.employeeCode || '未命名员工')
const officialPhotoPlaceholder = computed(() => buildOfficialPhotoPlaceholder(employeeName.value))

// loadCards reads tenant BusinessCards and narrows the result to this employee for display-only detail views.
async function loadCards() {
  if (!activeTenantId.value || !props.employeeContext.employeeId) {
    cards.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listBusinessCardsApi(activeTenantId.value, {
      employeeId: props.employeeContext.employeeId,
      page: 1,
      pageSize: 20
    })
    cards.value = result.items ?? []
  } catch {
    cards.value = []
    errorMessage.value = '名片暂时无法加载'
  } finally {
    loading.value = false
  }
}

// buildOfficialPhotoPlaceholder returns a formal single-mark fallback for employee public identity.
function buildOfficialPhotoPlaceholder(name?: string) {
  const normalized = name?.trim()
  return normalized ? normalized.slice(0, 1).toUpperCase() : '职'
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

watch(
  () => props.employeeContext.officialPhotoUrl,
  () => {
    officialPhotoUrl.value = props.employeeContext.officialPhotoUrl ?? null
  },
  { immediate: true }
)

watch([activeTenantId, () => props.employeeContext.employeeId], () => {
  void loadCards()
})

onMounted(loadCards)
</script>

<template>
  <section class="employee-business-card-display">
    <Skeleton v-if="loading" active :paragraph="{ rows: 4 }" />
    <div v-else-if="errorMessage" class="employee-business-card-display__empty">
      <strong>{{ errorMessage }}</strong>
      <span>稍后刷新员工详情即可重试。</span>
    </div>

    <div v-else class="employee-business-card-display__layout">
      <article class="employee-business-card-display__preview">
        <div class="employee-business-card-display__preview-head">
          <div>
            <span>{{ employeeContext.employeeCode || 'Employee' }}</span>
            <h3>{{ employeeName }}</h3>
            <p>{{ employeeContext.department || '未建立任职' }}</p>
          </div>
          <Tag v-if="primaryCard" :color="statusColor(primaryCard.status)">
            {{ statusLabel(primaryCard.status) }}
          </Tag>
        </div>

        <div class="employee-business-card-display__identity-row">
          <div
            class="employee-business-card-display__photo"
            :class="{ 'employee-business-card-display__photo--placeholder': !officialPhotoUrl }"
          >
            <img
              v-if="officialPhotoUrl"
              :alt="employeeName"
              :src="officialPhotoUrl"
            >
            <span v-else data-testid="employee-official-photo-placeholder">
              {{ officialPhotoPlaceholder }}
            </span>
          </div>
          <div class="employee-business-card-display__copy">
            <strong>{{ employeeName }} 的数字名片</strong>
            <span>{{ primaryCard ? '公开入口已连接' : '该员工暂无可展示名片' }}</span>
          </div>
        </div>

        <div class="employee-business-card-display__entry">
          <div class="employee-business-card-display__entry-copy">
            <span>公开入口</span>
            <a
              v-if="primaryCard?.publicEntryRef?.publicUrl"
              :href="primaryCard.publicEntryRef.publicUrl"
              rel="noreferrer"
              target="_blank"
            >
              {{ primaryCard.publicEntryRef.publicUrl }}
            </a>
            <strong v-else>尚未生成公开入口</strong>
          </div>
          <div v-if="primaryCard?.publicEntryRef?.publicUrl" class="employee-business-card-display__qr">
            <QRCode
              :size="64"
              :value="primaryCard.publicEntryRef.publicUrl"
            />
          </div>
        </div>
      </article>

    </div>
  </section>
</template>

<style scoped>
.employee-business-card-display {
  display: grid;
  gap: 12px;
}

.employee-business-card-display__layout {
  display: grid;
  grid-template-columns: minmax(280px, 420px);
  align-items: start;
}

.employee-business-card-display__preview {
  border: 1px solid rgb(226 232 240 / 0.92);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 34px -28px rgb(15 23 42 / 0.32);
}

.employee-business-card-display__preview {
  display: grid;
  gap: 18px;
  overflow: hidden;
  padding: 18px;
  transition:
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.employee-business-card-display__preview:hover {
  box-shadow: 0 22px 42px -30px rgb(15 23 42 / 0.42);
  transform: translateY(-2px);
}

.employee-business-card-display__preview-head,
.employee-business-card-display__entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.employee-business-card-display__preview-head span,
.employee-business-card-display__entry span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.employee-business-card-display__preview-head h3 {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.employee-business-card-display__preview-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.employee-business-card-display__identity-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: end;
  gap: 16px;
}

.employee-business-card-display__photo {
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  background:
    linear-gradient(145deg, #f8fafc, #e2edf6),
    #f8fafc;
  color: #2f5f73;
  font-weight: 750;
}

.employee-business-card-display__photo {
  width: 92px;
  height: 112px;
  font-size: 34px;
  box-shadow: 0 14px 28px -22px rgb(15 23 42 / 0.55);
}

.employee-business-card-display__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-business-card-display__copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.employee-business-card-display__copy strong {
  color: #0f172a;
  font-size: 16px;
  line-height: 1.35;
}

.employee-business-card-display__copy span {
  color: #64748b;
  font-size: 13px;
}

.employee-business-card-display__entry {
  min-width: 0;
  border-top: 1px solid #edf2f7;
  padding-top: 14px;
}

.employee-business-card-display__entry a,
.employee-business-card-display__entry strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.employee-business-card-display__entry-copy {
  min-width: 0;
}

.employee-business-card-display__qr {
  display: grid;
  width: 74px;
  height: 74px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 24px -22px rgb(15 23 42 / 0.48);
}

.employee-business-card-display__empty {
  display: grid;
  gap: 4px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 18px;
  color: hsl(var(--muted-foreground));
}

.employee-business-card-display__empty strong {
  color: hsl(var(--foreground));
}

@media (max-width: 768px) {
  .employee-business-card-display__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .employee-business-card-display__identity-row,
  .employee-business-card-display__entry {
    grid-template-columns: 1fr;
    align-items: start;
  }
}
</style>
