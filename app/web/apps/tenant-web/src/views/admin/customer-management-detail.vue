<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  bindManagedCustomerAccountToTenantPartyApi,
  changeManagedCustomerStatusApi,
  getManagedCustomerAccountByIdApi,
  updateManagedCustomerAccountBasicsApi,
  upsertManagedCustomerAddressApi,
  upsertManagedCustomerContactApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface BasicFormState {
  customerCategory: string
  displayName: string
  tagsText: string
}

interface BindingFormState {
  tenantPartyId: string
}

interface ContactFormState {
  customerContactId?: string
  displayName: string
  roleTitle: string
  email: string
  phone: string
  isPrimaryContact: boolean
  isActive: boolean
}

interface AddressFormState {
  customerAddressId?: string
  label: string
  countryCode: string
  region: string
  locality: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  isPrimaryAddress: boolean
  isActive: boolean
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const customerAccountId = computed(() => `${route.params.customerAccountId ?? ''}`)
const customerAccount = ref<CustomerManagementApi.CustomerAccount | null>(null)
const contacts = ref<CustomerManagementApi.CustomerContact[]>([])
const addresses = ref<CustomerManagementApi.CustomerAddress[]>([])
const statusValue = ref<CustomerManagementApi.CustomerStatus>('ACTIVE_CUSTOMER')
const basicForm = reactive<BasicFormState>({
  customerCategory: '',
  displayName: '',
  tagsText: ''
})
const bindingForm = reactive<BindingFormState>({
  tenantPartyId: ''
})
const contactForm = reactive<ContactFormState>(createEmptyContactForm())
const addressForm = reactive<AddressFormState>(createEmptyAddressForm())

/** loadCustomerDetail refreshes the account shell plus contacts and addresses from the BFF detail aggregate. */
async function loadCustomerDetail() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  const result = await getManagedCustomerAccountByIdApi(activeTenantId.value, customerAccountId.value)
  customerAccount.value = result.customerAccount
  contacts.value = result.contacts ?? []
  addresses.value = result.addresses ?? []
  basicForm.displayName = result.customerAccount.displayName
  basicForm.customerCategory = result.customerAccount.customerCategory
  basicForm.tagsText = result.customerAccount.tags.join(', ')
  bindingForm.tenantPartyId = result.customerAccount.primaryBinding?.tenantPartyId ?? ''
  statusValue.value =
    (result.customerAccount.status as CustomerManagementApi.CustomerStatus) || 'ACTIVE_CUSTOMER'
}

/** saveBasics updates only the frozen customer account basics fields. */
async function saveBasics() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  await updateManagedCustomerAccountBasicsApi(activeTenantId.value, customerAccountId.value, {
    displayName: basicForm.displayName.trim() || undefined,
    customerCategory: basicForm.customerCategory.trim() || undefined,
    tags: splitTags(basicForm.tagsText)
  })
  await loadCustomerDetail()
}

/** saveBinding updates the phase 1 active primary tenantPartyId binding only. */
async function saveBinding() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  await bindManagedCustomerAccountToTenantPartyApi(activeTenantId.value, customerAccountId.value, {
    tenantPartyId: bindingForm.tenantPartyId.trim()
  })
  await loadCustomerDetail()
}

/** editContact hydrates the contact form from one existing row so the same upsert path can update it. */
function editContact(contact: CustomerManagementApi.CustomerContact) {
  contactForm.customerContactId = contact.customerContactId
  contactForm.displayName = contact.displayName
  contactForm.roleTitle = contact.roleTitle
  contactForm.email = contact.email
  contactForm.phone = contact.phone
  contactForm.isPrimaryContact = contact.isPrimaryContact
  contactForm.isActive = contact.isActive
}

/** saveContact sends one contact upsert and refreshes the aggregate detail payload. */
async function saveContact() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  await upsertManagedCustomerContactApi(activeTenantId.value, customerAccountId.value, {
    customerContactId: contactForm.customerContactId || undefined,
    displayName: contactForm.displayName.trim(),
    roleTitle: contactForm.roleTitle.trim() || undefined,
    email: contactForm.email.trim() || undefined,
    phone: contactForm.phone.trim() || undefined,
    isPrimaryContact: contactForm.isPrimaryContact,
    isActive: contactForm.isActive
  })
  resetContactForm()
  await loadCustomerDetail()
}

/** editAddress hydrates the address form from one existing row so the same upsert path can update it. */
function editAddress(address: CustomerManagementApi.CustomerAddress) {
  addressForm.customerAddressId = address.customerAddressId
  addressForm.label = address.label
  addressForm.countryCode = address.countryCode
  addressForm.region = address.region
  addressForm.locality = address.locality
  addressForm.addressLine1 = address.addressLine1
  addressForm.addressLine2 = address.addressLine2
  addressForm.postalCode = address.postalCode
  addressForm.isPrimaryAddress = address.isPrimaryAddress
  addressForm.isActive = address.isActive
}

/** saveAddress sends one address upsert and refreshes the aggregate detail payload. */
async function saveAddress() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  await upsertManagedCustomerAddressApi(activeTenantId.value, customerAccountId.value, {
    customerAddressId: addressForm.customerAddressId || undefined,
    label: addressForm.label.trim(),
    countryCode: addressForm.countryCode.trim(),
    region: addressForm.region.trim() || undefined,
    locality: addressForm.locality.trim() || undefined,
    addressLine1: addressForm.addressLine1.trim(),
    addressLine2: addressForm.addressLine2.trim() || undefined,
    postalCode: addressForm.postalCode.trim() || undefined,
    isPrimaryAddress: addressForm.isPrimaryAddress,
    isActive: addressForm.isActive
  })
  resetAddressForm()
  await loadCustomerDetail()
}

/** saveStatus sends the minimal lifecycle mutation without piggybacking other edits. */
async function saveStatus() {
  if (!activeTenantId.value || !customerAccountId.value) {
    return
  }

  await changeManagedCustomerStatusApi(activeTenantId.value, customerAccountId.value, {
    status: statusValue.value
  })
  await loadCustomerDetail()
}

/** resetContactForm clears the current contact editor so the next save can create a fresh row. */
function resetContactForm() {
  Object.assign(contactForm, createEmptyContactForm())
}

/** resetAddressForm clears the current address editor so the next save can create a fresh row. */
function resetAddressForm() {
  Object.assign(addressForm, createEmptyAddressForm())
}

/** splitTags normalizes the simple comma-separated tags input into the phase 1 string array payload. */
function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** createEmptyContactForm seeds the CRM contact upsert editor with phase 1 defaults. */
function createEmptyContactForm(): ContactFormState {
  return {
    customerContactId: undefined,
    displayName: '',
    roleTitle: '',
    email: '',
    phone: '',
    isPrimaryContact: false,
    isActive: true
  }
}

/** createEmptyAddressForm seeds the CRM address upsert editor with phase 1 defaults. */
function createEmptyAddressForm(): AddressFormState {
  return {
    customerAddressId: undefined,
    label: '',
    countryCode: '',
    region: '',
    locality: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    isPrimaryAddress: false,
    isActive: true
  }
}

onMounted(() => {
  void loadCustomerDetail()
})
</script>

<template>
  <Page>
    <section class="customer-detail-page">
      <header class="customer-detail-card">
        <h1>客户详情</h1>
        <p>phase 1 只暴露基础信息、主绑定、联系人、地址和状态切换，不扩展 Selector adoption、财务信息或多主体模型。</p>
      </header>

      <section class="customer-detail-card">
        <h2>基础信息</h2>
        <div class="customer-detail-grid">
          <label>
            <span>Display Name</span>
            <input data-testid="detail-customer-display-name" v-model="basicForm.displayName" />
          </label>
          <label>
            <span>Customer Category</span>
            <input data-testid="detail-customer-category" v-model="basicForm.customerCategory" />
          </label>
          <label>
            <span>Tags</span>
            <input data-testid="detail-customer-tags" v-model="basicForm.tagsText" />
          </label>
        </div>
        <button data-testid="detail-save-basics" type="button" @click="saveBasics">保存基础信息</button>
      </section>

      <section class="customer-detail-card">
        <h2>主绑定</h2>
        <p v-if="customerAccount?.primaryBinding">
          当前绑定：{{ customerAccount.primaryBinding.tenantPartyId }} · {{ customerAccount.primaryBinding.partyDisplayName }}
        </p>
        <div class="customer-detail-grid">
          <label>
            <span>Tenant Party Id</span>
            <input data-testid="detail-bind-tenant-party" v-model="bindingForm.tenantPartyId" />
          </label>
        </div>
        <button data-testid="detail-save-binding" type="button" @click="saveBinding">保存主绑定</button>
      </section>

      <section class="customer-detail-card">
        <h2>联系人</h2>
        <ul class="customer-detail-list">
          <li v-for="contact in contacts" :key="contact.customerContactId">
            {{ contact.displayName }} · {{ contact.roleTitle || '-' }} · {{ contact.email || '-' }}
            <button
              :data-testid="`detail-edit-contact-${contact.customerContactId}`"
              type="button"
              @click="editContact(contact)"
            >
              编辑
            </button>
          </li>
        </ul>
        <div class="customer-detail-grid">
          <label>
            <span>联系人姓名</span>
            <input data-testid="detail-contact-name" v-model="contactForm.displayName" />
          </label>
          <label>
            <span>角色 / 职务</span>
            <input data-testid="detail-contact-role" v-model="contactForm.roleTitle" />
          </label>
          <label>
            <span>Email</span>
            <input data-testid="detail-contact-email" v-model="contactForm.email" />
          </label>
          <label>
            <span>Phone</span>
            <input data-testid="detail-contact-phone" v-model="contactForm.phone" />
          </label>
          <label class="customer-detail-check">
            <input
              data-testid="detail-contact-primary"
              type="checkbox"
              v-model="contactForm.isPrimaryContact"
            />
            <span>Primary Contact</span>
          </label>
        </div>
        <button data-testid="detail-save-contact" type="button" @click="saveContact">保存联系人</button>
      </section>

      <section class="customer-detail-card">
        <h2>地址</h2>
        <ul class="customer-detail-list">
          <li v-for="address in addresses" :key="address.customerAddressId">
            {{ address.label }} · {{ address.countryCode }} · {{ address.addressLine1 }}
            <button
              :data-testid="`detail-edit-address-${address.customerAddressId}`"
              type="button"
              @click="editAddress(address)"
            >
              编辑
            </button>
          </li>
        </ul>
        <div class="customer-detail-grid">
          <label>
            <span>Label</span>
            <input data-testid="detail-address-label" v-model="addressForm.label" />
          </label>
          <label>
            <span>Country Code</span>
            <input data-testid="detail-address-country" v-model="addressForm.countryCode" />
          </label>
          <label>
            <span>Region</span>
            <input data-testid="detail-address-region" v-model="addressForm.region" />
          </label>
          <label>
            <span>Locality</span>
            <input data-testid="detail-address-locality" v-model="addressForm.locality" />
          </label>
          <label>
            <span>Address Line 1</span>
            <input data-testid="detail-address-line1" v-model="addressForm.addressLine1" />
          </label>
          <label>
            <span>Address Line 2</span>
            <input data-testid="detail-address-line2" v-model="addressForm.addressLine2" />
          </label>
          <label>
            <span>Postal Code</span>
            <input data-testid="detail-address-postal" v-model="addressForm.postalCode" />
          </label>
          <label class="customer-detail-check">
            <input
              data-testid="detail-address-primary"
              type="checkbox"
              v-model="addressForm.isPrimaryAddress"
            />
            <span>Primary Address</span>
          </label>
        </div>
        <button data-testid="detail-save-address" type="button" @click="saveAddress">保存地址</button>
      </section>

      <section class="customer-detail-card">
        <h2>状态</h2>
        <div class="customer-detail-grid customer-detail-grid--compact">
          <label>
            <span>Status</span>
            <select data-testid="detail-customer-status" v-model="statusValue">
              <option value="ACTIVE_CUSTOMER">ACTIVE_CUSTOMER</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        </div>
        <button data-testid="detail-save-status" type="button" @click="saveStatus">保存状态</button>
      </section>

      <section class="customer-detail-card">
        <h2>Deferred / 引用说明</h2>
        <ul>
          <li>`customerAccountId` 不是 Sales 主引用；稳定主体引用仍然是 active primary `tenantPartyId`。</li>
          <li>phase 1 不扩展多主体、多 legal entity、bill-to / ship-to 复杂模型。</li>
          <li>不在当前页面引入 AR / credit / payment、Customer 360 或 CustomerItemMapping。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.customer-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.customer-detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.customer-detail-card h1,
.customer-detail-card h2 {
  margin: 0 0 12px;
}

.customer-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.customer-detail-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.customer-detail-grid--compact {
  max-width: 260px;
}

.customer-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 12px;
  padding-left: 20px;
}

.customer-detail-check {
  align-items: center;
  flex-direction: row !important;
  gap: 8px;
}

button,
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 36px;
  padding: 8px 10px;
}

button {
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}
</style>
