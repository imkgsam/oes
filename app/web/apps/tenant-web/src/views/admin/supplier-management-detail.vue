<script setup lang="ts">
import type { SupplierManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  bindManagedSupplierToTenantPartyApi,
  changeManagedSupplierStatusApi,
  getManagedSupplierByIdApi,
  updateManagedSupplierBasicsApi,
  upsertManagedSupplierAddressApi,
  upsertManagedSupplierContactApi,
  upsertManagedSupplierOfferingApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface BasicFormState {
  displayName: string
  supplierNo: string
  supplierCategory: string
  tagsText: string
}

interface BindingFormState {
  tenantPartyId: string
}

interface ContactFormState {
  supplierContactId?: string
  displayName: string
  roleTitle: string
  email: string
  phone: string
  isPrimaryContact: boolean
  isActive: boolean
}

interface AddressFormState {
  supplierAddressId?: string
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

interface OfferingFormState {
  supplierOfferingId?: string
  itemId: string
  status: SupplierManagementApi.SupplierOfferingStatus
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const supplierId = computed(() => `${route.params.supplierId ?? ''}`)
const supplier = ref<SupplierManagementApi.SupplierProfile | null>(null)
const contacts = ref<SupplierManagementApi.SupplierContact[]>([])
const addresses = ref<SupplierManagementApi.SupplierAddress[]>([])
const offerings = ref<SupplierManagementApi.SupplierOffering[]>([])
const supplierStatus = ref<SupplierManagementApi.SupplierStatus>('ACTIVE')
const basicForm = reactive<BasicFormState>({
  displayName: '',
  supplierNo: '',
  supplierCategory: '',
  tagsText: ''
})
const bindingForm = reactive<BindingFormState>({
  tenantPartyId: ''
})
const contactForm = reactive<ContactFormState>(createEmptyContactForm())
const addressForm = reactive<AddressFormState>(createEmptyAddressForm())
const offeringForm = reactive<OfferingFormState>(createEmptyOfferingForm())

/** loadSupplierDetail refreshes the supplier shell plus contacts, addresses, and offerings from the BFF detail aggregate. */
async function loadSupplierDetail() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  const result = await getManagedSupplierByIdApi(activeTenantId.value, supplierId.value)
  supplier.value = result.supplier
  contacts.value = result.contacts ?? []
  addresses.value = result.addresses ?? []
  offerings.value = result.offerings ?? []
  basicForm.displayName = result.supplier.displayName
  basicForm.supplierNo = result.supplier.supplierNo
  basicForm.supplierCategory = result.supplier.supplierCategory
  basicForm.tagsText = result.supplier.tags.join(', ')
  bindingForm.tenantPartyId = result.supplier.partyBinding?.tenantPartyId ?? ''
  supplierStatus.value = (result.supplier.status as SupplierManagementApi.SupplierStatus) || 'ACTIVE'
}

/** saveBasics updates only the frozen supplier profile basics fields. */
async function saveBasics() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await updateManagedSupplierBasicsApi(activeTenantId.value, supplierId.value, {
    displayName: basicForm.displayName.trim() || undefined,
    supplierNo: basicForm.supplierNo.trim() || undefined,
    supplierCategory: basicForm.supplierCategory.trim() || undefined,
    tags: splitTags(basicForm.tagsText)
  })
  await loadSupplierDetail()
}

/** saveBinding updates the phase 1 formal tenantPartyId binding only. */
async function saveBinding() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await bindManagedSupplierToTenantPartyApi(activeTenantId.value, supplierId.value, {
    tenantPartyId: bindingForm.tenantPartyId.trim()
  })
  await loadSupplierDetail()
}

/** editContact hydrates the contact form from one existing row so the same upsert path can update it. */
function editContact(contact: SupplierManagementApi.SupplierContact) {
  contactForm.supplierContactId = contact.supplierContactId
  contactForm.displayName = contact.displayName
  contactForm.roleTitle = contact.roleTitle
  contactForm.email = contact.email
  contactForm.phone = contact.phone
  contactForm.isPrimaryContact = contact.isPrimaryContact
  contactForm.isActive = contact.isActive
}

/** saveContact sends one contact upsert and refreshes the aggregate detail payload. */
async function saveContact() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await upsertManagedSupplierContactApi(activeTenantId.value, supplierId.value, {
    supplierContactId: contactForm.supplierContactId || undefined,
    displayName: contactForm.displayName.trim(),
    roleTitle: contactForm.roleTitle.trim() || undefined,
    email: contactForm.email.trim() || undefined,
    phone: contactForm.phone.trim() || undefined,
    isPrimaryContact: contactForm.isPrimaryContact,
    isActive: contactForm.isActive
  })
  resetContactForm()
  await loadSupplierDetail()
}

/** editAddress hydrates the address form from one existing row so the same upsert path can update it. */
function editAddress(address: SupplierManagementApi.SupplierAddress) {
  addressForm.supplierAddressId = address.supplierAddressId
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
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await upsertManagedSupplierAddressApi(activeTenantId.value, supplierId.value, {
    supplierAddressId: addressForm.supplierAddressId || undefined,
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
  await loadSupplierDetail()
}

/** editOffering hydrates the offering form from one existing row so the same upsert path can update it. */
function editOffering(offering: SupplierManagementApi.SupplierOffering) {
  offeringForm.supplierOfferingId = offering.supplierOfferingId
  offeringForm.itemId = offering.itemId
  offeringForm.status =
    (offering.status as SupplierManagementApi.SupplierOfferingStatus) || 'ACTIVE'
}

/** saveOffering sends one supplier-offering upsert and refreshes the aggregate detail payload. */
async function saveOffering() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await upsertManagedSupplierOfferingApi(activeTenantId.value, supplierId.value, {
    supplierOfferingId: offeringForm.supplierOfferingId || undefined,
    itemId: offeringForm.itemId.trim(),
    status: offeringForm.status
  })
  resetOfferingForm()
  await loadSupplierDetail()
}

/** saveStatus sends the minimal lifecycle mutation without piggybacking other edits. */
async function saveStatus() {
  if (!activeTenantId.value || !supplierId.value) {
    return
  }

  await changeManagedSupplierStatusApi(activeTenantId.value, supplierId.value, {
    status: supplierStatus.value
  })
  await loadSupplierDetail()
}

/** resetContactForm clears the current contact editor so the next save can create a fresh row. */
function resetContactForm() {
  Object.assign(contactForm, createEmptyContactForm())
}

/** resetAddressForm clears the current address editor so the next save can create a fresh row. */
function resetAddressForm() {
  Object.assign(addressForm, createEmptyAddressForm())
}

/** resetOfferingForm clears the current offering editor so the next save can create a fresh row. */
function resetOfferingForm() {
  Object.assign(offeringForm, createEmptyOfferingForm())
}

/** splitTags normalizes the simple comma-separated tags input into the phase 1 string array payload. */
function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** createEmptyContactForm seeds the SRM contact upsert editor with phase 1 defaults. */
function createEmptyContactForm(): ContactFormState {
  return {
    supplierContactId: undefined,
    displayName: '',
    roleTitle: '',
    email: '',
    phone: '',
    isPrimaryContact: false,
    isActive: true
  }
}

/** createEmptyAddressForm seeds the SRM address upsert editor with phase 1 defaults. */
function createEmptyAddressForm(): AddressFormState {
  return {
    supplierAddressId: undefined,
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

/** createEmptyOfferingForm seeds the SRM offering upsert editor with phase 1 defaults. */
function createEmptyOfferingForm(): OfferingFormState {
  return {
    supplierOfferingId: undefined,
    itemId: '',
    status: 'ACTIVE'
  }
}

onMounted(() => {
  void loadSupplierDetail()
})
</script>

<template>
  <Page>
    <section class="supplier-detail-page">
      <header class="supplier-detail-card">
        <h1>供应商详情</h1>
        <p>phase 1 只暴露基础信息、正式主体绑定、联系人、地址、状态切换和 SupplierOffering，不扩展 SupplierItemMapping 或采购商业条款。</p>
      </header>

      <section class="supplier-detail-card">
        <h2>基础信息</h2>
        <div class="supplier-detail-grid">
          <label>
            <span>Display Name</span>
            <input data-testid="detail-supplier-display-name" v-model="basicForm.displayName" />
          </label>
          <label>
            <span>Supplier No</span>
            <input data-testid="detail-supplier-no" v-model="basicForm.supplierNo" />
          </label>
          <label>
            <span>Supplier Category</span>
            <input data-testid="detail-supplier-category" v-model="basicForm.supplierCategory" />
          </label>
          <label>
            <span>Tags</span>
            <input data-testid="detail-supplier-tags" v-model="basicForm.tagsText" />
          </label>
        </div>
        <button data-testid="detail-save-basics" type="button" @click="saveBasics">保存基础信息</button>
      </section>

      <section class="supplier-detail-card">
        <h2>正式主体绑定</h2>
        <p v-if="supplier?.partyBinding">
          当前绑定：{{ supplier.partyBinding.tenantPartyId }} · {{ supplier.partyBinding.partyDisplayName }}
        </p>
        <div class="supplier-detail-grid">
          <label>
            <span>Tenant Party Id</span>
            <input data-testid="detail-bind-tenant-party" v-model="bindingForm.tenantPartyId" />
          </label>
        </div>
        <button data-testid="detail-save-binding" type="button" @click="saveBinding">保存绑定</button>
      </section>

      <section class="supplier-detail-card">
        <h2>联系人</h2>
        <ul class="supplier-detail-list">
          <li v-for="contact in contacts" :key="contact.supplierContactId">
            {{ contact.displayName }} · {{ contact.roleTitle || '-' }} · {{ contact.email || '-' }}
            <button
              :data-testid="`detail-edit-contact-${contact.supplierContactId}`"
              type="button"
              @click="editContact(contact)"
            >
              编辑
            </button>
          </li>
        </ul>
        <div class="supplier-detail-grid">
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
          <label class="supplier-detail-check">
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

      <section class="supplier-detail-card">
        <h2>地址</h2>
        <ul class="supplier-detail-list">
          <li v-for="address in addresses" :key="address.supplierAddressId">
            {{ address.label }} · {{ address.countryCode }} · {{ address.addressLine1 }}
            <button
              :data-testid="`detail-edit-address-${address.supplierAddressId}`"
              type="button"
              @click="editAddress(address)"
            >
              编辑
            </button>
          </li>
        </ul>
        <div class="supplier-detail-grid">
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
          <label class="supplier-detail-check">
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

      <section class="supplier-detail-card">
        <h2>SupplierOffering</h2>
        <p class="supplier-detail-note">这里只维护 supplier + item 的可供应关系，不展示价格、MOQ、账期或 lead time。</p>
        <ul class="supplier-detail-list">
          <li v-for="offering in offerings" :key="offering.supplierOfferingId">
            {{ offering.itemCode || offering.itemId }} · {{ offering.itemName || '-' }} · {{ offering.status }}
            <button
              :data-testid="`detail-edit-offering-${offering.supplierOfferingId}`"
              type="button"
              @click="editOffering(offering)"
            >
              编辑
            </button>
          </li>
        </ul>
        <div class="supplier-detail-grid supplier-detail-grid--compact">
          <label>
            <span>Item Id</span>
            <input data-testid="detail-offering-item-id" v-model="offeringForm.itemId" />
          </label>
          <label>
            <span>Status</span>
            <select data-testid="detail-offering-status" v-model="offeringForm.status">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </div>
        <button data-testid="detail-save-offering" type="button" @click="saveOffering">保存可供应关系</button>
      </section>

      <section class="supplier-detail-card">
        <h2>状态</h2>
        <div class="supplier-detail-grid supplier-detail-grid--compact">
          <label>
            <span>Status</span>
            <select data-testid="detail-supplier-status" v-model="supplierStatus">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </div>
        <button data-testid="detail-save-status" type="button" @click="saveStatus">保存状态</button>
      </section>

      <section class="supplier-detail-card">
        <h2>Deferred / 引用说明</h2>
        <ul>
          <li>`tenantPartyId` 才是正式主体稳定引用，当前页面不复制 Party truth。</li>
          <li>`SupplierOffering` 只表达 supplier + item 可供应关系，不是价格表。</li>
          <li>不在当前页面引入 SupplierItemMapping、RFQ、SupplierQuote、采购价格、MOQ、账期或 lead time。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.supplier-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.supplier-detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.supplier-detail-card h1,
.supplier-detail-card h2 {
  margin: 0 0 12px;
}

.supplier-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.supplier-detail-grid--compact {
  max-width: 420px;
}

.supplier-detail-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.supplier-detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 12px;
  padding-left: 18px;
}

.supplier-detail-check {
  align-items: center;
  flex-direction: row !important;
  gap: 8px !important;
}

.supplier-detail-note {
  color: #64748b;
  margin: 0 0 12px;
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
