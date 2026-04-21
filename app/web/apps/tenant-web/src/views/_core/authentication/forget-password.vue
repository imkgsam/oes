<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { SliderCaptcha } from '@vben/common-ui'
import { Button, Card, Form, FormItem, Input, InputPassword, message } from 'ant-design-vue'

import {
  completePasswordRecoveryApi,
  inspectPasswordRecoveryChannelsApi,
  requestPasswordRecoveryChallengeApi,
  verifyPasswordRecoveryChallengeApi
} from '#/api'

type RecoveryChannel = 'EMAIL' | 'PHONE'

defineOptions({ name: 'ForgetPassword' })

const router = useRouter()
const currentStep = ref(0)
const inspectLoading = ref(false)
const challengeLoading = ref(false)
const verifyLoading = ref(false)
const completionLoading = ref(false)
const completed = ref(false)

const progressSteps = [
  { title: '验证身份', shortTitle: '身份' },
  { title: '选择方式', shortTitle: '方式' },
  { title: '输入验证码', shortTitle: '验证' },
  { title: '设置新密码', shortTitle: '重置' }
]

const formState = reactive({
  availableChannels: [] as Array<{ channel: RecoveryChannel; maskedDestination: string }>,
  captchaPassed: false,
  challengeId: '',
  confirmPassword: '',
  identifier: '',
  maskedDestination: '',
  newPassword: '',
  otp: '',
  resetToken: '',
  selectedChannel: '' as '' | RecoveryChannel
})

const helperTitle = computed(() => {
  if (currentStep.value === 0) {
    return '确认账号'
  }

  if (currentStep.value === 1) {
    return '选择接收方式'
  }

  if (currentStep.value === 2) {
    return '安全验证'
  }

  return completed.value ? '设置完成' : '设置新密码'
})

const stageNumber = computed(() => {
  return completed.value ? progressSteps.length : currentStep.value + 1
})

const canInspectChannels = computed(() => {
  return formState.captchaPassed && isSupportedIdentifier(formState.identifier.trim())
})

const canRequestChallenge = computed(() => {
  return Boolean(formState.selectedChannel) && Boolean(formState.identifier.trim())
})

const canVerifyOtp = computed(
  () => Boolean(formState.challengeId) && /^\d{6}$/.test(formState.otp.trim())
)

const canComplete = computed(() => {
  return (
    Boolean(formState.resetToken) &&
    formState.newPassword.trim().length >= 8 &&
    formState.confirmPassword.trim().length >= 8
  )
})

function isSupportedIdentifier(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) || /^\+?\d[\d\s()-]{5,}$/.test(identifier)
}

function channelLabel(channel: RecoveryChannel): string {
  return channel === 'EMAIL' ? '邮箱' : '手机号'
}

function channelDescription(channel: RecoveryChannel): string {
  return channel === 'EMAIL' ? '接收邮箱验证码' : '接收短信验证码'
}

function goToLogin() {
  void router.push('/auth/login')
}

function resetCaptcha() {
  formState.captchaPassed = false
}

function resetRecoveryState() {
  currentStep.value = 0
  completed.value = false
  formState.availableChannels = []
  formState.challengeId = ''
  formState.confirmPassword = ''
  formState.maskedDestination = ''
  formState.newPassword = ''
  formState.otp = ''
  formState.resetToken = ''
  formState.selectedChannel = ''
  resetCaptcha()
}

function chooseChannel(channel: RecoveryChannel) {
  formState.selectedChannel = channel
}

function resolveMaskedDestination(channel: RecoveryChannel) {
  return (
    formState.availableChannels.find((item) => item.channel === channel)?.maskedDestination ?? ''
  )
}

async function inspectChannels() {
  if (!canInspectChannels.value) {
    message.error('请输入有效的邮箱或手机号，并完成安全验证。')
    return
  }

  inspectLoading.value = true

  try {
    const result = await inspectPasswordRecoveryChannelsApi({
      identifier: formState.identifier.trim()
    })

    formState.availableChannels = result.channels ?? []
    formState.selectedChannel = result.defaultChannel ?? ''

    if (!formState.availableChannels.length) {
      message.error('当前账号暂不支持通过该方式找回密码。')
      return
    }

    if (result.defaultChannel) {
      await requestChallenge(result.defaultChannel)
      return
    }

    currentStep.value = 1
  } finally {
    inspectLoading.value = false
  }
}

async function requestChallenge(channel = formState.selectedChannel) {
  if (!channel || !canRequestChallenge.value) {
    message.error('请选择接收验证码的方式。')
    return
  }

  challengeLoading.value = true

  try {
    const result = await requestPasswordRecoveryChallengeApi({
      channel,
      identifier: formState.identifier.trim()
    })

    formState.selectedChannel = channel
    formState.challengeId = result.challengeId
    formState.maskedDestination = result.maskedDestination ?? resolveMaskedDestination(channel)
    currentStep.value = 2
    message.success('验证码已发送，请完成验证。')
  } finally {
    challengeLoading.value = false
  }
}

async function verifyOtp() {
  if (!canVerifyOtp.value) {
    message.error('请输入 6 位验证码。')
    return
  }

  verifyLoading.value = true

  try {
    const result = await verifyPasswordRecoveryChallengeApi({
      challengeId: formState.challengeId,
      otp: formState.otp.trim()
    })

    formState.resetToken = result.resetToken
    currentStep.value = 3
    message.success('验证成功，请设置新密码。')
  } finally {
    verifyLoading.value = false
  }
}

async function completeRecovery() {
  if (!canComplete.value) {
    message.error('请完整填写新密码和确认密码。')
    return
  }

  completionLoading.value = true

  try {
    const result = await completePasswordRecoveryApi({
      resetToken: formState.resetToken,
      newPassword: formState.newPassword.trim(),
      confirmPassword: formState.confirmPassword.trim()
    })

    completed.value = result.success
    message.success('密码已更新，请重新登录。')
  } finally {
    completionLoading.value = false
  }
}
</script>

<template>
  <div class="forget-password-page">
    <Card class="forget-password-card" :bordered="false">
      <div class="forget-password-hero">
        <p class="forget-password-eyebrow">Account Recovery</p>
        <h2 class="forget-password-title">找回密码</h2>
        <p class="forget-password-subtitle">完成身份验证后即可重置登录密码。</p>
      </div>

      <ol class="forget-password-progress">
        <li
          v-for="(step, index) in progressSteps"
          :key="step.title"
          :class="[
            'forget-password-progress__item',
            {
              'is-active': !completed && currentStep === index,
              'is-complete': completed || currentStep > index
            }
          ]"
        >
          <span class="forget-password-progress__index">
            {{ index + 1 }}
          </span>
          <span class="forget-password-progress__label">
            <span class="forget-password-progress__title">{{ step.title }}</span>
            <span class="forget-password-progress__short">{{ step.shortTitle }}</span>
          </span>
        </li>
      </ol>

      <div class="forget-password-surface">
        <div class="forget-password-panel">
          <div class="forget-password-panel__header">
            <h3>{{ helperTitle }}</h3>
            <span>步骤 {{ stageNumber }}/{{ progressSteps.length }}</span>
          </div>

          <Form layout="vertical">
            <div v-if="currentStep === 0" class="forget-password-section">
              <FormItem label="登录邮箱或手机号">
                <Input
                  placeholder="name@company.com / +8613800138000"
                  :value="formState.identifier"
                  @update:value="formState.identifier = $event"
                />
              </FormItem>

              <FormItem label="安全验证">
                <div class="forget-password-captcha">
                  <SliderCaptcha
                    v-model="formState.captchaPassed"
                    success-text="验证通过"
                    text="请按住滑块拖动"
                  />
                </div>
              </FormItem>

              <div class="forget-password-actions">
                <Button @click="goToLogin">返回登录</Button>
                <Button
                  :disabled="!canInspectChannels"
                  :loading="inspectLoading"
                  type="primary"
                  @click="inspectChannels"
                >
                  继续
                </Button>
              </div>
            </div>

            <div v-else-if="currentStep === 1" class="forget-password-section">
              <div class="forget-password-summary">
                <span>当前账号</span>
                <strong>{{ formState.identifier.trim() }}</strong>
              </div>

              <div class="forget-password-channel-list">
                <button
                  v-for="item in formState.availableChannels"
                  :key="item.channel"
                  :class="[
                    'forget-password-channel-card',
                    { 'is-active': formState.selectedChannel === item.channel }
                  ]"
                  type="button"
                  @click="chooseChannel(item.channel)"
                >
                  <div class="forget-password-channel-card__body">
                    <span>{{ channelLabel(item.channel) }}</span>
                    <strong>{{ item.maskedDestination }}</strong>
                  </div>
                  <small>{{ channelDescription(item.channel) }}</small>
                </button>
              </div>

              <div class="forget-password-actions">
                <Button @click="resetRecoveryState">重新输入</Button>
                <Button
                  :disabled="!canRequestChallenge"
                  :loading="challengeLoading"
                  type="primary"
                  @click="requestChallenge()"
                >
                  发送验证码
                </Button>
              </div>
            </div>

            <div v-else-if="currentStep === 2" class="forget-password-section">
              <div v-if="formState.maskedDestination" class="forget-password-summary">
                <span>验证码已发送至</span>
                <strong>{{ formState.maskedDestination }}</strong>
              </div>

              <FormItem label="验证码">
                <Input
                  placeholder="请输入 6 位验证码"
                  :value="formState.otp"
                  @update:value="formState.otp = $event"
                />
              </FormItem>

              <div class="forget-password-actions">
                <Button @click="currentStep = formState.availableChannels.length > 1 ? 1 : 0">
                  上一步
                </Button>
                <Button
                  :disabled="!canVerifyOtp"
                  :loading="verifyLoading"
                  type="primary"
                  @click="verifyOtp"
                >
                  验证
                </Button>
              </div>
            </div>

            <div v-else class="forget-password-section">
              <div v-if="!completed" class="forget-password-section">
                <FormItem label="新密码">
                  <InputPassword
                    placeholder="请输入至少 8 位的新密码"
                    :value="formState.newPassword"
                    @update:value="formState.newPassword = $event"
                  />
                </FormItem>

                <FormItem label="确认新密码">
                  <InputPassword
                    placeholder="请再次输入新密码"
                    :value="formState.confirmPassword"
                    @update:value="formState.confirmPassword = $event"
                  />
                </FormItem>

                <div class="forget-password-actions">
                  <Button @click="currentStep = 2">上一步</Button>
                  <Button
                    :disabled="!canComplete"
                    :loading="completionLoading"
                    type="primary"
                    @click="completeRecovery"
                  >
                    重置密码
                  </Button>
                </div>
              </div>

              <div v-else class="forget-password-success">
                <h3>密码重置完成</h3>
                <p>登录密码已更新，请返回登录页重新进入系统。</p>
                <Button type="primary" @click="goToLogin">返回登录</Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.forget-password-page {
  padding: 8px 0 16px;
}

.forget-password-card {
  border: 1px solid hsl(var(--border));
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, hsl(var(--primary) / 0.12), transparent 32%),
    linear-gradient(180deg, hsl(var(--card)), hsl(var(--muted) / 0.42));
  box-shadow: 0 18px 50px hsl(var(--foreground) / 0.08);
}

.forget-password-hero {
  display: grid;
  gap: 10px;
}

.forget-password-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}

.forget-password-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.forget-password-subtitle {
  margin: 0;
  max-width: 520px;
  font-size: 14px;
  line-height: 1.8;
  color: hsl(var(--muted-foreground));
}

.forget-password-progress {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 28px 0 20px;
  padding: 0;
  list-style: none;
}

.forget-password-progress__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  min-height: 72px;
  padding: 14px 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 18px;
  background: hsl(var(--card) / 0.86);
  color: hsl(var(--muted-foreground));
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.forget-password-progress__item.is-active {
  border-color: hsl(var(--primary));
  box-shadow: 0 12px 24px hsl(var(--primary) / 0.12);
  color: hsl(var(--foreground));
}

.forget-password-progress__item.is-complete {
  border-color: hsl(var(--primary) / 0.32);
  color: hsl(var(--foreground));
}

.forget-password-progress__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: hsl(var(--muted));
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.forget-password-progress__item.is-active .forget-password-progress__index,
.forget-password-progress__item.is-complete .forget-password-progress__index {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.forget-password-progress__label {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.forget-password-progress__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.forget-password-progress__short {
  display: none;
  font-size: 13px;
  font-weight: 600;
}

.forget-password-surface {
  border: 1px solid hsl(var(--border));
  border-radius: 24px;
  background: hsl(var(--card) / 0.88);
  padding: 22px;
}

.forget-password-panel {
  display: grid;
  gap: 18px;
}

.forget-password-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.forget-password-panel__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.forget-password-panel__header span {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.forget-password-section {
  display: grid;
  gap: 18px;
}

.forget-password-captcha {
  padding: 14px;
  border-radius: 18px;
  background: hsl(var(--muted) / 0.55);
  border: 1px dashed hsl(var(--border));
}

.forget-password-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: hsl(var(--muted) / 0.48);
  border: 1px solid hsl(var(--border));
  font-size: 13px;
}

.forget-password-summary span {
  color: hsl(var(--muted-foreground));
}

.forget-password-summary strong {
  color: hsl(var(--foreground));
}

.forget-password-channel-list {
  display: grid;
  gap: 12px;
}

.forget-password-channel-card {
  display: grid;
  gap: 10px;
  width: 100%;
  padding: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 18px;
  background:
    linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted) / 0.42));
  color: hsl(var(--foreground));
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.forget-password-channel-card:hover,
.forget-password-channel-card.is-active {
  border-color: hsl(var(--primary));
  box-shadow: 0 12px 24px hsl(var(--primary) / 0.12);
  transform: translateY(-1px);
}

.forget-password-channel-card__body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.forget-password-channel-card__body span {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.forget-password-channel-card__body strong {
  font-size: 15px;
}

.forget-password-channel-card small {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.forget-password-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.forget-password-success {
  display: grid;
  gap: 14px;
  padding: 14px 0 4px;
}

.forget-password-success h3 {
  margin: 0;
  font-size: 20px;
}

.forget-password-success p {
  margin: 0;
  color: hsl(var(--muted-foreground));
  line-height: 1.8;
}

@media (max-width: 640px) {
  .forget-password-title {
    font-size: 24px;
  }

  .forget-password-progress {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .forget-password-progress__title {
    display: none;
  }

  .forget-password-progress__short {
    display: inline;
  }

  .forget-password-panel__header,
  .forget-password-actions,
  .forget-password-summary,
  .forget-password-channel-card__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .forget-password-actions :deep(button) {
    width: 100%;
  }
}
</style>
