<script lang="ts" setup>
import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

import { Card, Tag } from 'ant-design-vue';

import { useAuthContextStore } from '#/store/auth-context';

const authContextStore = useAuthContextStore();
const userStore = useUserStore();

const contextItems = computed(() => [
  {
    label: '当前用户',
    value:
      authContextStore.operatorName ||
      userStore.userInfo?.realName ||
      userStore.userInfo?.username ||
      '-',
  },
  {
    label: authContextStore.isPlatformScope ? '平台账号' : '当前账号',
    value: authContextStore.accountName || userStore.userInfo?.username || '-',
  },
  {
    label: '当前范围',
    value: authContextStore.isPlatformScope
      ? '系统平台'
      : authContextStore.tenantName || '租户上下文',
  },
  {
    label: '默认首页',
    value: authContextStore.homePath || userStore.userInfo?.homePath || '-',
  },
]);

const quickActions = [
  {
    description: '进入租户资料、组织、岗位、成员和角色授权入口。',
    tag: '当前优先',
    title: '租户治理',
  },
  {
    description: '查看待办、消息提醒和后续审批协同入口。',
    tag: '逐步接入',
    title: '协同与待办',
  },
  {
    description: '预留销售、采购、库存、制造与计划等业务域入口。',
    tag: '后续扩展',
    title: '业务域导航',
  },
];

const statusCards = [
  {
    label: '登录链路',
    value: '已接通',
  },
  {
    label: '工作台首页',
    value: '可访问',
  },
  {
    label: '业务域页面',
    value: '待逐步接入',
  },
];
</script>

<template>
  <div class="flex flex-col gap-5 p-5">
    <Card :bordered="false">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold">OES Tenant Workbench</span>
            <Tag color="blue">Dashboard</Tag>
          </div>
          <p class="max-w-3xl text-sm leading-6 text-gray-600">
            当前工作台用于承接登录后的统一入口。现阶段优先支撑租户治理、
            协同待办和后续业务域导航，避免在后端业务能力尚未稳定时堆砌演示页面。
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            v-for="item in statusCards"
            :key="item.label"
            class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <div class="text-xs text-gray-500">{{ item.label }}</div>
            <div class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.value }}
            </div>
          </div>
        </div>
      </div>
    </Card>

    <div class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold">当前上下文</span>
            <Tag color="green">Session Ready</Tag>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-4">
          <div
            v-for="item in contextItems"
            :key="item.label"
            class="rounded-lg border border-gray-100 bg-white px-4 py-3"
          >
            <div class="text-xs text-gray-500">{{ item.label }}</div>
            <div class="mt-1 text-sm font-semibold text-gray-900">
              {{ item.value }}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <template #title>
          <span class="text-base font-semibold">本阶段说明</span>
        </template>
        <div class="space-y-2 text-sm leading-6 text-gray-600">
          <p>1. 登录、MFA、账户选择和登出主链已接通。</p>
          <p>2. 初始化上下文、导航可见入口和操作码摘要已接入 BFF 阶段一契约。</p>
          <p>3. dashboard 先作为稳定入口，后续再逐步接入业务域模块。</p>
        </div>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card
        v-for="action in quickActions"
        :key="action.title"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ action.title }}</h3>
            <Tag>{{ action.tag }}</Tag>
          </div>
          <p class="text-sm leading-6 text-gray-600">{{ action.description }}</p>
        </div>
      </Card>
    </div>
  </div>
</template>
