<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts'
import type { UserApi } from '#/api'

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { AuthenticationLoginExpiredModal } from '@vben/common-ui'
import { useWatermark } from '@vben/hooks'
import { BasicLayout, LockScreen, Notification, UserDropdown } from '@vben/layouts'
import { preferences } from '@vben/preferences'
import { useAccessStore, useUserStore } from '@vben/stores'

import { Button, Empty, message, Modal, Spin, Tag } from 'ant-design-vue'

import { getSessionContextsApi } from '#/api'
import { useAuthStore } from '#/store'
import { useAuthContextStore } from '#/store/auth-context'
import LoginForm from '#/views/_core/authentication/login.vue'

const notifications = ref<NotificationItem[]>([
  {
    avatar: preferences.app.defaultAvatar,
    id: 1,
    date: '当前阶段',
    isRead: false,
    message: '登录、MFA、账户选择和登出链路已接通，适合作为首轮手动联调基线。',
    title: '认证主链已完成第一轮接入'
  },
  {
    avatar: preferences.app.defaultAvatar,
    id: 2,
    date: '已接入',
    isRead: false,
    message:
      '登录后上下文、导航可见入口和权限摘要已由 auth-bff 提供，前端会继续收敛到这些稳定契约。',
    title: '认证上下文已接入 BFF'
  },
  {
    avatar: preferences.app.defaultAvatar,
    id: 3,
    date: '下一步',
    isRead: false,
    message: '建议继续推进 dashboard 手动联调与退出登录体验收尾。',
    title: '工作台与登出体验继续收敛'
  }
])

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const authContextStore = useAuthContextStore()
const accessStore = useAccessStore()
const { destroyWatermark, updateWatermark } = useWatermark()
const contextModalOpen = ref(false)
const contextItems = ref<UserApi.SessionContextOption[]>([])
const contextLoading = ref(false)
const contextSwitchingAccountId = ref('')
const showDot = computed(() => notifications.value.some((item) => !item.isRead))
const currentContextItem = computed(() => contextItems.value.find((item) => item.isCurrent) ?? null)
const switchableContextItems = computed(() => contextItems.value.filter((item) => !item.isCurrent))

// Builds the user dropdown menu from the authenticated session scope and action codes.
const menus = computed(() => {
  const items = [
    {
      handler: () => {
        router.push({ name: 'PersonalCenter' })
      },
      icon: 'lucide:user-round',
      text: '个人中心'
    },
    {
      handler: () => {
        void openContextSwitch()
      },
      icon: 'lucide:repeat',
      text: '切换账号'
    },
    {
      handler: () => {
        router.push({ name: 'SelfSecurityCenter' })
      },
      icon: 'lucide:shield-check',
      text: '账户安全'
    }
  ]

  items.push({
    handler: () => {
      router.push(authContextStore.homePath)
    },
    icon: 'lucide:layout-dashboard',
    text: '返回首页'
  })

  return items
})

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar
})

async function handleLogout() {
  await authStore.logout(true)
}

async function openContextSwitch() {
  contextLoading.value = true
  contextItems.value = []

  try {
    const result = await getSessionContextsApi()
    contextItems.value = result.items ?? []
    window.setTimeout(() => {
      contextModalOpen.value = true
    }, 0)
  } catch (error) {
    contextModalOpen.value = false
    message.error('加载可切换账号失败，请稍后重试。')
    throw error
  } finally {
    contextLoading.value = false
  }
}

function closeContextSwitch() {
  if (contextSwitchingAccountId.value) {
    return
  }
  contextModalOpen.value = false
}

async function handleContextSwitch(accountId: string) {
  contextSwitchingAccountId.value = accountId

  try {
    await authStore.switchAccountContext(accountId)
    contextModalOpen.value = false
  } catch {
    // keep the dialog open so the operator can retry or inspect the current options
  } finally {
    contextSwitchingAccountId.value = ''
  }
}

function handleNoticeClear() {
  notifications.value = []
}

function markRead(id: number | string) {
  const item = notifications.value.find((item) => item.id === id)
  if (item) {
    item.isRead = true
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id)
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true))
}

function handleOpenAccountSwitchEvent() {
  void openContextSwitch()
}

onMounted(() => {
  window.addEventListener('oes:open-account-switch', handleOpenAccountSwitchEvent)
})

onBeforeUnmount(() => {
  window.removeEventListener('oes:open-account-switch', handleOpenAccountSwitchEvent)
})

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content: content || `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`
      })
    } else {
      destroyWatermark()
    }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.username"
        :tag-text="authContextStore.scopeLabel"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal v-model:open="accessStore.loginExpired" :avatar>
        <LoginForm />
      </AuthenticationLoginExpiredModal>
      <Modal
        :footer="null"
        :mask-closable="!contextSwitchingAccountId"
        v-model:open="contextModalOpen"
        :title="'切换账号'"
        width="520px"
        @cancel="closeContextSwitch"
      >
        <Spin :spinning="contextLoading">
          <div class="space-y-5 py-1">
            <div class="text-xs leading-5 text-muted-foreground">
              切换后会同步刷新当前登录态、导航和权限。
            </div>

            <div class="space-y-2">
              <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                当前账号
              </div>

              <div
                v-if="currentContextItem"
                class="rounded-md border border-border bg-muted/10 px-4 py-3"
              >
                <div class="flex items-center justify-between gap-4">
                  <div class="min-w-0 space-y-1.5">
                    <div class="truncate text-sm font-medium text-foreground">
                      {{ currentContextItem.displayName || '未命名账号' }}
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Tag :bordered="false" color="default">
                        {{ currentContextItem.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT' }}
                      </Tag>
                      <span>
                        {{
                          currentContextItem.scopeLevel === 'SYSTEM'
                            ? '系统平台'
                            : currentContextItem.tenantName || currentContextItem.tenantId || '租户账号'
                        }}
                      </span>
                    </div>
                  </div>
                  <span class="text-xs text-muted-foreground">当前</span>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                可切换账号
              </div>

              <Empty
                v-if="switchableContextItems.length === 0 && !contextLoading"
                description="当前没有其他可切换的账号"
              />

              <div v-else class="space-y-2">
                <div
                  v-for="item in switchableContextItems"
                  :key="item.accountId"
                  class="rounded-md border border-border bg-background px-4 py-3 transition-colors hover:border-primary/35"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0 space-y-1.5">
                      <div class="truncate text-sm font-medium text-foreground">
                        {{ item.displayName || '未命名账号' }}
                      </div>
                      <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Tag :bordered="false" color="default">
                          {{ item.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT' }}
                        </Tag>
                        <span>
                          {{
                            item.scopeLevel === 'SYSTEM'
                              ? '系统平台'
                              : item.tenantName || item.tenantId || '租户账号'
                          }}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="small"
                      type="primary"
                      :loading="contextSwitchingAccountId === item.accountId"
                      @click="handleContextSwitch(item.accountId)"
                    >
                      切换
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </Modal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
