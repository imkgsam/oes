<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui'

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { AuthenticationLogin, VbenButton, z } from '@vben/common-ui'
import { SvgGithubIcon, SvgGoogleIcon, SvgQQChatIcon, SvgWeChatIcon } from '@vben/icons'
import { $t } from '@vben/locales'
import { message } from 'ant-design-vue'

import { useAuthStore } from '#/store'

import {
  resolveAuthLoginScenePreference,
  saveAuthLoginScenePreference
} from './auth-login-preference'
import PhoneNumberInput from './phone-number-input.vue'

defineOptions({ name: 'Login' })

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const loginFormRef = ref<InstanceType<typeof AuthenticationLogin>>()

type PasswordLoginMode = 'email' | 'phone'

const storedPasswordPreference = computed(() =>
  resolveAuthLoginScenePreference('password')
)

const loginMode = computed<PasswordLoginMode>(() => {
  if (route.query.mode === 'phone') {
    return 'phone'
  }

  if (route.query.mode === 'email') {
    return 'email'
  }

  return storedPasswordPreference.value?.mode === 'phone' ? 'phone' : 'email'
})

const isPhoneMode = computed(() => loginMode.value === 'phone')

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
  if (isPhoneMode.value) {
    saveAuthLoginScenePreference('password', {
      mode: 'phone',
      phoneNumber: `${values.phoneNumber ?? ''}`.trim()
    })
    try {
      await authStore.authPhonePasswordLogin({
        password: values.password,
        phoneNumber: values.phoneNumber
      })
      return
    } catch {
      return
    }
    return
  }

  saveAuthLoginScenePreference('password', {
    mode: 'email',
    email: `${values.username ?? ''}`.trim()
  })
  try {
    await authStore.authLogin(values)
  } catch {
    return
  }
}

async function goToGenericCodeLogin() {
  const values = await loginFormRef.value?.getFormApi?.().getValues?.()
  const identifier = `${isPhoneMode.value ? values?.phoneNumber ?? '' : values?.username ?? ''}`.trim()
  const fallbackIdentifier =
    loginMode.value === 'phone'
      ? `${storedPasswordPreference.value?.phoneNumber ?? ''}`.trim()
      : `${storedPasswordPreference.value?.email ?? ''}`.trim()
  const effectiveIdentifier = identifier || fallbackIdentifier

  saveAuthLoginScenePreference('password', isPhoneMode.value
    ? {
        mode: 'phone',
        phoneNumber: effectiveIdentifier
      }
    : {
        mode: 'email',
        email: effectiveIdentifier
      })

  void router.push({
    name: 'CodeLogin',
    query: effectiveIdentifier
      ? {
          mode: loginMode.value,
          identifier: effectiveIdentifier
        }
      : { mode: loginMode.value }
  })
}

function goToQrCodeLogin() {
  void router.push({ name: 'QrCodeLogin' })
}

// Carries the current login identifier into password recovery without sharing page-local form state.
function goToForgetPassword(values: Record<string, any>) {
  const identifier = `${isPhoneMode.value ? values.phoneNumber ?? '' : values.username ?? ''}`.trim()

  void router.push({
    name: 'ForgetPassword',
    query: identifier ? { identifier } : {}
  })
}

function handleThirdPartyLogin(provider: string) {
  message.info(`${provider} 登录能力暂未开放。`)
}

function switchPasswordMode(mode: PasswordLoginMode) {
  void router.replace({
    name: 'Login',
    query: { mode }
  })
}

// Restores the remembered identifier for the current password-login mode when the route itself does not override that choice.
function syncStoredIdentifier() {
  const preference = storedPasswordPreference.value
  if (!preference || preference.mode !== loginMode.value) {
    return
  }

  const identifier =
    loginMode.value === 'phone'
      ? `${preference.phoneNumber ?? ''}`.trim()
      : `${preference.email ?? ''}`.trim()

  if (!identifier) {
    return
  }

  loginFormRef.value
    ?.getFormApi?.()
    .setFieldValue(loginMode.value === 'phone' ? 'phoneNumber' : 'username', identifier)
}

onMounted(syncStoredIdentifier)

watch(() => loginMode.value, syncStoredIdentifier)
</script>

<template>
  <div class="space-y-4">
    <AuthenticationLogin
      ref="loginFormRef"
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
      @forget-password="goToForgetPassword"
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
