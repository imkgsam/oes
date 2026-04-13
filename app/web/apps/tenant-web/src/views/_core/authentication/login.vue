<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui'

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { AuthenticationLogin, SliderCaptcha, VbenButton, z } from '@vben/common-ui'
import { SvgGithubIcon, SvgGoogleIcon, SvgQQChatIcon, SvgWeChatIcon } from '@vben/icons'
import { $t } from '@vben/locales'
import { message } from 'ant-design-vue'

import { useAuthStore } from '#/store'

import PhoneNumberInput from './phone-number-input.vue'

defineOptions({ name: 'Login' })

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const sliderPassed = ref(false)
const sliderRef = ref<InstanceType<typeof SliderCaptcha>>()

type PasswordLoginMode = 'email' | 'phone'

const loginMode = computed<PasswordLoginMode>(() => {
  return route.query.mode === 'phone' ? 'phone' : 'email'
})

const isPhoneMode = computed(() => loginMode.value === 'phone')

// Converts rejected login attempts into user-facing feedback without leaking unhandled promise errors.
function handleLoginError() {
  resetSlider()
}

const formSchema = computed((): VbenFormSchema[] => {
  const phoneSchema: VbenFormSchema[] = [
    {
      component: PhoneNumberInput,
      componentProps: {
        placeholder: '请输入手机号'
      },
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(6, { message: $t('authentication.mobileTip') })
        .refine((v) => /^\+\d{6,20}$/.test(`${v ?? ''}`.trim()), {
          message: '请输入正确的手机号'
        })
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password')
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(6, { message: '密码长度需为 6-30 位' })
        .max(30, { message: '密码长度需为 6-30 位' })
    }
  ]

  const emailSchema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'name@company.com'
      },
      fieldName: 'username',
      label: '邮箱',
      rules: z.string().email({ message: '请输入有效邮箱地址' })
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password')
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(6, { message: '密码长度需为 6-30 位' })
        .max(30, { message: '密码长度需为 6-30 位' })
    }
  ]

  return isPhoneMode.value ? phoneSchema : emailSchema
})

async function handleSubmit(values: Record<string, any>) {
  if (!sliderPassed.value) {
    return
  }

  if (isPhoneMode.value) {
    try {
      await authStore.authPhonePasswordLogin({
        password: values.password,
        phoneNumber: values.phoneNumber
      })
      return
    } catch {
      handleLoginError()
    }
    return
  }

  try {
    await authStore.authLogin(values)
  } catch {
    handleLoginError()
  }
}

function goToGenericCodeLogin() {
  resetSlider()
  void router.push({
    name: 'CodeLogin',
    query: { mode: loginMode.value }
  })
}

function goToQrCodeLogin() {
  resetSlider()
  void router.push({ name: 'QrCodeLogin' })
}

function handleThirdPartyLogin(provider: string) {
  message.info(`${provider} 登录能力暂未开放。`)
}

function switchPasswordMode(mode: PasswordLoginMode) {
  resetSlider()
  void router.replace({
    name: 'Login',
    query: { mode }
  })
}

function resetSlider() {
  sliderPassed.value = false
  sliderRef.value?.resume?.()
}
</script>

<template>
  <div class="space-y-4">
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="false"
      :show-forget-password="true"
      :show-qrcode-login="false"
      :show-register="false"
      :show-third-party-login="false"
      :sub-title="
        isPhoneMode
          ? '使用手机号和密码登录 OES 租户业务 Web'
          : '使用邮箱和密码登录 OES 租户业务 Web'
      "
      title="欢迎使用 OES"
      @submit="handleSubmit"
    >
      <template #form-prepend>
        <div class="mb-5 flex items-center gap-10">
          <button
            :class="
              isPhoneMode
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            "
            class="border-b-[3px] pb-2 text-sm font-medium transition-colors"
            type="button"
            @click="switchPasswordMode('phone')"
          >
            手机号
          </button>
          <button
            :class="
              isPhoneMode
                ? 'border-transparent text-muted-foreground'
                : 'border-primary text-primary'
            "
            class="border-b-[3px] pb-2 text-sm font-medium transition-colors"
            type="button"
            @click="switchPasswordMode('email')"
          >
            邮箱
          </button>
        </div>
      </template>

      <template #submit-prepend>
        <div class="mb-4">
          <SliderCaptcha
            ref="sliderRef"
            v-model="sliderPassed"
            :class="{
              'opacity-80': authStore.loginLoading
            }"
            success-text="验证通过"
            text="请按住滑块拖动"
          />
        </div>
      </template>

      <template #third-party-login>
        <div class="mt-6 space-y-6">
          <div class="grid grid-cols-2 gap-5">
            <VbenButton
              class="w-full"
              variant="outline"
              @click="goToGenericCodeLogin"
            >
              验证码登录
            </VbenButton>
            <VbenButton
              class="w-full"
              variant="outline"
              @click="goToQrCodeLogin"
            >
              扫码登录
            </VbenButton>
          </div>

          <div class="flex items-center gap-8 text-muted-foreground">
            <span class="h-px flex-1 bg-border"></span>
            <span class="text-sm">其他登录方式</span>
            <span class="h-px flex-1 bg-border"></span>
          </div>

          <div class="flex items-center justify-center gap-5">
            <button
              class="flex size-7 items-center justify-center rounded-full text-[#44b549] transition-colors hover:bg-accent/40"
              type="button"
              @click="handleThirdPartyLogin('微信')"
            >
              <SvgWeChatIcon class="size-4" />
            </button>
            <button
              class="flex size-7 items-center justify-center rounded-full text-[#12b7f5] transition-colors hover:bg-accent/40"
              type="button"
              @click="handleThirdPartyLogin('QQ')"
            >
              <SvgQQChatIcon class="size-4" />
            </button>
            <button
              class="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent/40"
              type="button"
              @click="handleThirdPartyLogin('GitHub')"
            >
              <SvgGithubIcon class="size-4" />
            </button>
            <button
              class="flex size-7 items-center justify-center rounded-full text-[#4285f4] transition-colors hover:bg-accent/40"
              type="button"
              @click="handleThirdPartyLogin('Google')"
            >
              <SvgGoogleIcon class="size-4" />
            </button>
          </div>
        </div>
      </template>

      <template #to-register>
        <div class="mt-8 text-center text-sm">
          还没有账号？
          <span class="vben-link text-sm font-normal"> 创建账号 </span>
        </div>
      </template>
    </AuthenticationLogin>
  </div>
</template>
