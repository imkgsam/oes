<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useAuthStore } from '#/store';
import { useAuthContextStore } from '#/store/auth-context';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([
  {
    avatar: preferences.app.defaultAvatar,
    id: 1,
    date: '当前阶段',
    isRead: false,
    message: '登录、MFA、账户选择和登出链路已接通，适合作为首轮手动联调基线。',
    title: '认证主链已完成第一轮接入',
  },
  {
    avatar: preferences.app.defaultAvatar,
    id: 2,
    date: '已接入',
    isRead: false,
    message:
      '登录后上下文、导航可见入口和权限摘要已由 auth-bff 提供，前端会继续收敛到这些稳定契约。',
    title: '认证上下文已接入 BFF',
  },
  {
    avatar: preferences.app.defaultAvatar,
    id: 3,
    date: '下一步',
    isRead: false,
    message: '建议继续推进 dashboard 手动联调与退出登录体验收尾。',
    title: '工作台与登出体验继续收敛',
  },
]);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const authContextStore = useAuthContextStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

// Builds the user dropdown menu from the authenticated session scope and action codes.
const menus = computed(() => {
  const items = [
    {
      handler: () => {
        router.push({ name: 'SelfSecurityCenter' });
      },
      icon: 'lucide:shield-check',
      text: '账户安全',
    },
  ];

  if (
    authContextStore.actionCodes.includes('auth.audit.list') ||
    authContextStore.actionCodes.includes('auth.session.admin.view')
  ) {
    items.push({
      handler: () => {
        router.push({ name: 'AdminAuthSessionManagement' });
      },
      icon: 'lucide:shield',
      text: '认证与会话管理',
    });
  }

  items.push({
    handler: () => {
      router.push(authContextStore.homePath);
    },
    icon: 'lucide:layout-dashboard',
    text: '返回首页',
  });

  return items;
});

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(true);
}

function handleNoticeClear() {
  notifications.value = [];
}

function markRead(id: number | string) {
  const item = notifications.value.find((item) => item.id === id);
  if (item) {
    item.isRead = true;
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
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
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
