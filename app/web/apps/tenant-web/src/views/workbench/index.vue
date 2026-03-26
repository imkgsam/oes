<script lang="ts" setup>
const capabilityCards = [
  {
    description: '用户、组织、角色、终端准入与租户配置入口。',
    title: '租户治理',
  },
  {
    description: '销售、采购、财务、仓储、生产、质检等核心业务入口。',
    title: '业务中台',
  },
  {
    description: '待办、审批、消息、报表与岗位工作台入口。',
    title: '工作协同',
  },
];
</script>

<template>
  <div class="space-y-5 p-5">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">OES Tenant Web</span>
          <el-tag type="primary">Tenant Workbench</el-tag>
        </div>
      </template>
      <p class="text-sm leading-6 text-gray-600">
        这是 OES 租户业务 Web 的起始入口。当前阶段先落统一租户工作台，
        后续逐步接入租户配置、业务操作、审批、监管与报表能力。
      </p>
    </el-card>

    <div class="grid gap-4 md:grid-cols-3">
      <el-card
        v-for="card in capabilityCards"
        :key="card.title"
        shadow="hover"
      >
        <div class="space-y-2">
          <h3 class="text-base font-semibold">{{ card.title }}</h3>
          <p class="text-sm leading-6 text-gray-600">{{ card.description }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>
