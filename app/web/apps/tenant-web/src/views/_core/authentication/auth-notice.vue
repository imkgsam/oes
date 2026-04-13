<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    actionText?: string;
    description: string;
    loginPath?: string;
    title: string;
  }>(),
  {
    actionText: '返回登录',
    loginPath: '/auth/login',
  },
);

const router = useRouter();

function goToLogin() {
  router.push(props.loginPath);
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-semibold">{{ title }}</h2>
      <p class="text-sm leading-6 text-muted-foreground">
        {{ description }}
      </p>
    </div>

    <Button class="w-full" @click="goToLogin">
      {{ actionText }}
    </Button>
  </div>
</template>
