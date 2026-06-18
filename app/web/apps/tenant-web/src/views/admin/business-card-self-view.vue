<script setup lang="ts">
import { Page } from '@vben/common-ui'

import PersonalBusinessCardSection from '../_core/profile/components/personal-business-card-section.vue'
</script>

<template>
  <Page title="我的名片">
    <div class="business-card-self-view">
      <PersonalBusinessCardSection />
    </div>
  </Page>
</template>

<style scoped>
.business-card-self-view {
  max-width: 1040px;
}
</style>
