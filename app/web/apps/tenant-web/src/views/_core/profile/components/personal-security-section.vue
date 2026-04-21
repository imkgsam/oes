<script setup lang="ts">
import type { PersonalCenterApi } from '#/api/bff/personal-center';

import { useRouter } from 'vue-router';

import { Button, Card, Tooltip } from 'ant-design-vue';

const props = defineProps<{
  entries: PersonalCenterApi.SecurityEntry[];
}>();

const router = useRouter();

function openEntry(path: string) {
  void router.push(path);
}
</script>

<template>
  <Card :bordered="false" class="section-card">
    <div>
      <div class="flex items-center gap-2">
        <div class="section-title">安全与常用入口</div>
        <Tooltip title="这里只提供入口，不在个人中心重复承载完整安全流程。">
          <span class="help-dot">?</span>
        </Tooltip>
      </div>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <div
        v-for="entry in entries"
        :key="entry.code"
        class="entry-card"
      >
        <div class="flex items-center gap-2">
          <div class="entry-title">{{ entry.label }}</div>
          <Tooltip
            :title="entry.code === 'session-security'
              ? '查看与管理当前账号在不同设备上的登录会话。'
              : '查看当前账号可用的 MFA 与恢复能力。'"
          >
            <span class="help-dot">?</span>
          </Tooltip>
        </div>
        <Button type="link" @click="openEntry(entry.path)">进入</Button>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.section-card {
  border: 1px solid hsl(var(--border));
  border-radius: 20px;
  background: hsl(var(--card));
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
}

.help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
  line-height: 1;
  cursor: help;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.entry-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  padding: 18px;
  background: hsl(var(--muted) / 0.45);
}

.entry-title {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

</style>
