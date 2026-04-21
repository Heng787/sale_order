<script setup>
import { ref, computed, watch, inject } from "vue";
import ItemsTable from "./items.vue";
import { generateRefNo } from "../data/brand.js";

const props = defineProps({ brand: Object });
const showToast = inject("showToast", () => {});

const todayVal = new Date();

// Form state
const refNo = ref(generateRefNo(props.brand.prefix));
const orderStatus = ref("draft");
const orderDate = ref(todayVal);
const expectDate = ref(todayVal);
const soCategory = ref("");
const selectedCustomer = ref(null);
const selectedEmployee = ref(null);
const depositAmount = ref(null);
const cashAccount = ref("");
const discountPct = ref(0);
const taxRate = ref(0);
const remarks = ref("");
const formKey = ref(0);
const printErrors = ref([]);
const errorFields = ref(new Set());

// Item totals lifted from child
const itemTotals = ref({ qty: 0, amount: "0.00" });
const onTotalsUpdate = (t) => { itemTotals.value = t; };

// Payment calculations
const subtotal = computed(() => parseFloat(itemTotals.value.amount) || 0);
const discountAmt = computed(() => subtotal.value * (discountPct.value || 0) / 100);
const afterDiscount = computed(() => subtotal.value - discountAmt.value);
const taxAmt = computed(() => afterDiscount.value * (taxRate.value || 0) / 100);
const grandTotal = computed(() => afterDiscount.value + taxAmt.value);
const balanceDue = computed(() => {
  const deposit = parseFloat(depositAmount.value) || 0;
  const balance = grandTotal.value - deposit;
  return balance < 0 ? '-$' + Math.abs(balance).toFixed(2) : '$' + balance.toFixed(2);
});

const fmt = (n) => Number(n || 0).toFixed(2);

// Customer object is used directly
const customerInfo = computed(() => selectedCustomer.value || null);

const copyRefNo = async () => {
  try {
    await navigator.clipboard.writeText(refNo.value);
    showToast("Ref No copied!");
  } catch {
    showToast("Failed to copy", "error");
  }
};

const addCustomer = () => {
  showToast("Add Customer feature coming soon", "info");
};

const validate = () => {
  const missing = [];
  const fields = new Set();
  if (!selectedCustomer.value) { missing.push("Customer"); fields.add("customer"); }
  if (!selectedEmployee.value) { missing.push("Employee"); fields.add("employee"); }
  if (!orderDate.value) { missing.push("Date"); fields.add("date"); }
  if (!expectDate.value) { missing.push("Expect Date"); fields.add("expectDate"); }
  if (depositAmount.value == null || depositAmount.value === "") { missing.push("Deposit Amount"); fields.add("depositAmount"); }
  if (!cashAccount.value) { missing.push("Cash Account"); fields.add("cashAccount"); }
  if (!itemTotals.value || itemTotals.value.qty <= 0) { missing.push("Items"); fields.add("items"); }
  errorFields.value = fields;
  printErrors.value = missing;
  return missing.length === 0;
};

const handlePrint = () => {
  if (!validate()) {
    showToast("Please fill required fields", "error");
    return;
  }
  window.print();
};

const handleSave = () => {
  if (!validate()) {
    showToast("Please fill required fields", "error");
    return;
  }
  const draft = {
    refNo: refNo.value,
    brandId: props.brand.id,
    status: orderStatus.value,
    orderDate: orderDate.value ? orderDate.value.toISOString().slice(0, 10) : null,
    expectDate: expectDate.value ? expectDate.value.toISOString().slice(0, 10) : null,
    customerId: selectedCustomer.value?.id ?? null,
    employee: selectedEmployee.value,
    soCategory: soCategory.value,
    depositAmount: depositAmount.value,
    cashAccount: cashAccount.value,
    discountPct: discountPct.value,
    taxRate: taxRate.value,
    remarks: remarks.value,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`so_draft_${refNo.value}`, JSON.stringify(draft));
    showToast("Order saved as draft");
  } catch {
    showToast("Failed to save — storage may be full", "error");
  }
};

const handleReset = () => {
  selectedCustomer.value = null;
  selectedEmployee.value = null;
  orderDate.value = new Date();
  expectDate.value = new Date();
  soCategory.value = "";
  depositAmount.value = null;
  cashAccount.value = "";
  discountPct.value = 0;
  taxRate.value = 0;
  remarks.value = "";
  orderStatus.value = "draft";
  printErrors.value = [];
  errorFields.value = new Set();
  formKey.value++;
  refNo.value = generateRefNo(props.brand.prefix);
  showToast("Form has been reset", "info");
};

// Clear errors when user fills in a field
watch(selectedCustomer, () => { errorFields.value.delete("customer"); });
watch(selectedEmployee, () => { errorFields.value.delete("employee"); });
watch(orderDate, () => { errorFields.value.delete("date"); });
watch(expectDate, () => { errorFields.value.delete("expectDate"); });
watch(depositAmount, () => { errorFields.value.delete("depositAmount"); });
watch(cashAccount, () => { errorFields.value.delete("cashAccount"); });
watch(itemTotals, () => { errorFields.value.delete("items"); }, { deep: true });

watch(
  () => props.brand,
  () => {
    selectedCustomer.value = null;
    selectedEmployee.value = null;
    soCategory.value = "";
    depositAmount.value = null;
    cashAccount.value = "";
    discountPct.value = 0;
    taxRate.value = 0;
    remarks.value = "";
    orderStatus.value = "draft";
    printErrors.value = [];
    errorFields.value = new Set();
    formKey.value++;
    refNo.value = generateRefNo(props.brand.prefix);
  },
);
</script>

<template>
  <div class="form-card">
    <!-- ── Title Bar ── -->
    <div class="form-titlebar">
      <div class="title-left">
        <div class="title-icon" :style="{ background: brand.color }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <span class="form-title">Sale Order</span>
      </div>
      <div class="titlebar-right">
        <Select size="small" v-model="orderStatus" :options="[{label: 'Draft', value: 'draft'}, {label: 'Confirmed', value: 'confirmed'}, {label: 'Cancelled', value: 'cancelled'}]" optionLabel="label" optionValue="value" class="status-select" :class="`status--${orderStatus}`" />
        <span class="required-note hide-xs">Field marked <span class="star">*</span> are required</span>
      </div>
    </div>

    <div class="form-body">
      <!-- ── Two-column fields grid ── -->
      <div class="fields-grid">
        <!-- LEFT COLUMN -->
        <div class="fields-col">
          <!-- Ref No -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Ref No</label>
            <InputGroup>
              <InputGroupAddon>REF</InputGroupAddon>
              <InputText size="small" :value="refNo" readonly />
              <Button size="small" icon="pi pi-copy" severity="secondary" @click="copyRefNo" aria-label="Copy Ref No" />
            </InputGroup>
          </div>

          <!-- Date -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Date</label>
            <DatePicker size="small" v-model="orderDate" dateFormat="yy-mm-dd" fluid :invalid="errorFields.has('date')" />
          </div>

          <!-- SO Category -->
          <div class="field">
            <label class="field-label">SO Category</label>
            <Select size="small" v-model="soCategory" :options="[{label:'Retail', value:'retail'}, {label:'Wholesale', value:'wholesale'}]" optionLabel="label" optionValue="value" placeholder="Select" fluid showClear />
          </div>

          <!-- Customer -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Customer</label>
            <InputGroup>
              <Select size="small" v-model="selectedCustomer" :options="brand.customers" optionLabel="name" placeholder="Select Customer" fluid :invalid="errorFields.has('customer')">
                <template #value="slotProps">
                  <span v-if="slotProps.value">{{ slotProps.value.id }} – {{ slotProps.value.name }}</span>
                  <span v-else>Select Customer</span>
                </template>
                <template #option="slotProps">
                  {{ slotProps.option.id }} – {{ slotProps.option.name }}
                </template>
              </Select>
              <Button size="small" outlined icon="pi pi-user-plus" @click="addCustomer" :style="{ color: brand.color, borderColor: brand.color }" title="Add Customer" />
            </InputGroup>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="fields-col">
          <!-- Expect Date -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Expect Date</label>
            <DatePicker size="small" v-model="expectDate" dateFormat="yy-mm-dd" fluid :invalid="errorFields.has('expectDate')" />
          </div>

          <!-- Employee -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Employee</label>
            <Select size="small" v-model="selectedEmployee" :options="brand.employees" placeholder="Select Employee" fluid :invalid="errorFields.has('employee')" />
          </div>

          <!-- Deposit Amount -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Deposit Amount</label>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputNumber size="small" v-model="depositAmount" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" fluid inputClass="amount-input" :invalid="errorFields.has('depositAmount')" />
            </InputGroup>
          </div>

          <!-- Cash Account -->
          <div class="field">
            <label class="field-label"><span class="star">*</span> Cash Account</label>
            <Select size="small" v-model="cashAccount" :options="[{label:'Cash', value:'cash'}, {label:'Bank Transfer', value:'bank'}, {label:'Cheque', value:'cheque'}]" optionLabel="label" optionValue="value" placeholder="Select" fluid showClear :invalid="errorFields.has('cashAccount')" />
          </div>
        </div>
      </div>

      <!-- ── Info Panels ── -->
      <div class="info-panels" v-if="customerInfo">
        <!-- Contact Panel -->
        <div class="info-panel">
          <div class="panel-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 6.73 19.79 19.79 0 01.21 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
            </svg>
            Contact
          </div>
          <div class="panel-row">
            <div class="panel-row-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 6.73 19.79 19.79 0 01.21 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
              </svg>
              <span class="panel-info-text">{{ customerInfo.tel }}</span>
            </div>
          </div>
          <div class="panel-row">
            <div class="panel-row-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span class="panel-info-text">{{ customerInfo.addr }}</span>
            </div>
          </div>
          <div class="panel-row total-row">
            <span>Total Amount</span>
            <span class="panel-total" :style="{ color: brand.color }">${{ fmt(grandTotal) }}</span>
          </div>
        </div>

        <!-- Financial Panel -->
        <div class="info-panel">
          <div class="panel-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Financial
          </div>
          <div class="panel-row">
            <div class="panel-row-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <span class="fin-label">Credit Limit</span>
            </div>
            <span class="panel-dollar">${{ fmt(customerInfo.creditLimit) }}</span>
          </div>
          <div class="panel-row">
            <div class="panel-row-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span class="fin-label">Deposit Bal</span>
            </div>
            <span class="panel-dollar">${{ fmt(customerInfo.depositBal) }}</span>
          </div>
          <div class="panel-row">
            <div class="panel-row-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <span class="fin-label">Invoice Bal</span>
            </div>
            <span class="panel-dollar" :style="{ color: customerInfo.invoiceBal > 0 ? brand.color : '#374151' }">
              ${{ fmt(customerInfo.invoiceBal) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty info panels when no customer -->
      <div class="info-panels" v-else>
        <div class="info-panel">
          <div class="panel-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 6.73 19.79 19.79 0 01.21 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
            </svg>
            Contact
          </div>
          <div class="panel-empty">Select a customer to view contact info</div>
        </div>
        <div class="info-panel">
          <div class="panel-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Financial
          </div>
          <div class="panel-empty">Select a customer to view financial info</div>
        </div>
      </div>

      <!-- ── Remarks ── -->
      <div class="field">
        <label class="field-label" style="display: flex; align-items: center; gap: 6px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Remarks / Notes
        </label>
        <Textarea v-model="remarks" rows="2" placeholder="Add any notes or special instructions…" fluid />
      </div>

      <!-- ── Items Table ── -->
      <div :class="{'items-error': errorFields.has('items')}">
        <ItemsTable :brand="brand" @update:totals="onTotalsUpdate" :key="formKey" />
      </div>

      <!-- ── Discount & Tax + Payment Summary ── -->
      <div class="summary-section">
        <div class="adj-row">
          <div class="adj-item">
            <label class="field-label">Discount (%)</label>
            <InputNumber size="small" v-model="discountPct" :min="0" :max="100" :minFractionDigits="0" :maxFractionDigits="1" placeholder="0" fluid inputClass="adj-input" />
          </div>
          <div class="adj-item">
            <label class="field-label">Tax (%)</label>
            <InputNumber size="small" v-model="taxRate" :min="0" :max="100" :minFractionDigits="0" :maxFractionDigits="1" placeholder="0" fluid inputClass="adj-input" />
          </div>
        </div>

        <div class="pay-summary">
          <div class="pay-row">
            <span class="pay-label">Subtotal</span>
            <span class="pay-value">${{ fmt(subtotal) }}</span>
          </div>
          <template v-if="discountPct > 0">
            <div class="pay-row">
              <span class="pay-label">Discount ({{ discountPct }}%)</span>
              <span class="pay-value pay-deduct">-${{ fmt(discountAmt) }}</span>
            </div>
          </template>
          <template v-if="taxRate > 0">
            <div class="pay-row">
              <span class="pay-label">Tax ({{ taxRate }}%)</span>
              <span class="pay-value">+${{ fmt(taxAmt) }}</span>
            </div>
          </template>
          <template v-if="discountPct > 0 || taxRate > 0">
            <div class="pay-row pay-grand-row">
              <span class="pay-label">Grand Total</span>
              <span class="pay-value pay-grand">${{ fmt(grandTotal) }}</span>
            </div>
          </template>
          <div class="pay-row">
            <span class="pay-label">Deposit Paid</span>
            <span class="pay-value pay-deduct">
              {{ depositAmount ? "-$" + fmt(parseFloat(depositAmount)) : "$0.00" }}
            </span>
          </div>
          <div class="pay-divider"></div>
          <div class="pay-row pay-total-row">
            <span class="pay-total-label">Balance Due</span>
            <span class="pay-total-val" :style="{ color: brand.color }">{{ balanceDue }}</span>
          </div>
        </div>
      </div>

      <!-- ── Print Alert ── -->
      <div v-if="printErrors.length > 0" class="print-alert">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <strong>Please fill in required fields:</strong>
          <span v-for="e in printErrors" :key="e" class="print-error-tag">{{ e }}</span>
        </div>
      </div>

      <!-- ── Action Buttons ── -->
      <div class="form-actions">
        <button class="btn-action btn-reset" @click="handleReset">
          <i class="pi pi-refresh"></i> New Order
        </button>
        <button class="btn-action btn-save" :style="{ color: brand.color, borderColor: brand.color }" @click="handleSave">
          <i class="pi pi-save"></i> Save Draft
        </button>
        <button class="btn-action btn-print" :style="{ background: brand.color, borderColor: brand.color }" @click="handlePrint">
          <i class="pi pi-print"></i> Print
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap");

/* ── Card ── */
.form-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.07);
  overflow: hidden;
  font-family: "DM Sans", sans-serif;
}

/* ── Title Bar ── */
.form-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  gap: 12px;
  flex-wrap: wrap;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 9px;
}

.title-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.25s;
}

.form-title {
  font-family: "Outfit", sans-serif;
  font-size: 14.5px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.2px;
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.required-note {
  font-size: 11.5px;
  color: #9ca3af;
}

.star { color: #ef4444; font-weight: 700; }

/* Status select badge */
.status-select {
  appearance: none;
  border: 1.5px solid;
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  outline: none;
  font-family: "DM Sans", sans-serif;
  transition: all 0.15s;
}

.status--draft {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}

.status--confirmed {
  background: #dcfce7;
  color: #16a34a;
  border-color: #86efac;
}

.status--cancelled {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* ── Form Body ── */
.form-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Fields Grid ── */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.fields-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Field ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.1px;
}

/* ── Base Input ── */
.field-input {
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 11px;
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
  color: #1f2937;
  background: #fff;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: v-bind("brand.color");
  box-shadow: 0 0 0 3px color-mix(in srgb, v-bind("brand.color") 12%, transparent);
}

.field-input[readonly] {
  background: #f8fafc;
  color: #6b7280;
  cursor: default;
}

.field-input.field-error {
  border-color: #f87171;
  background: #fff5f5;
}

.field-textarea {
  height: auto;
  padding: 6px 10px;
  resize: vertical;
  min-height: 56px;
}

.items-error {
  border: 1px solid #f87171;
  border-radius: 8px;
  padding: 2px;
  background: #fff5f5;
}

.amount-input { text-align: right; }

/* ── Select ── */
.select-wrap {
  position: relative;
}

.select-wrap::after {
  content: "";
  pointer-events: none;
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #9ca3af;
}

.field-select {
  appearance: none;
  cursor: pointer;
  padding-right: 28px;
}

/* ── Ref No group ── */
.ref-group { display: flex; align-items: center; }

.ref-prefix {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-right: none;
  border-radius: 6px 0 0 6px;
  padding: 0 10px;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.ref-input { border-radius: 0; flex: 1; min-width: 0; }

.ref-copy-btn {
  height: 36px;
  width: 36px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-left: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
  transition: background 0.15s;
}

.ref-copy-btn:hover { background: #e2e8f0; }
.ref-copy-btn:active { transform: scale(0.95); }

/* ── Customer ── */
.customer-wrap { display: flex; }
.customer-select-wrap { flex: 1; }
.customer-select-wrap::after { right: 11px; }
.customer-select { border-radius: 6px 0 0 6px; flex: 1; }

.customer-add-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.customer-add-btn:hover { opacity: 0.82; }
.customer-add-btn:active { transform: scale(0.95); }

/* ── Info Panels ── */
.info-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.info-panel {
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 1px;
}

.panel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #374151;
  gap: 8px;
}

.panel-row-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.panel-info-text { color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.total-row { margin-top: 3px; font-size: 12.5px; font-weight: 600; color: #111827; }
.panel-dollar { font-weight: 700; font-size: 13px; }
.panel-total { font-weight: 700; font-size: 13px; letter-spacing: -0.2px; transition: color 0.2s; }
.fin-label { color: #6b7280; }
.panel-empty { font-size: 11.5px; color: #c4c9d4; text-align: center; padding: 10px 0; font-style: italic; }

/* ── Date input ── */
.date-input { cursor: pointer; }
.date-input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

/* ── Summary section ── */
.summary-section {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.adj-row {
  display: flex;
  gap: 12px;
}

.adj-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 130px;
}

.adj-input { text-align: right; }

/* ── Payment Summary ── */
.pay-summary {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 18px;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 280px;
}

.pay-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
}

.pay-label { color: #6b7280; font-weight: 500; }
.pay-value { font-weight: 600; color: #374151; }
.pay-deduct { color: #10b981; }
.pay-grand-row { padding-top: 4px; }
.pay-grand { color: #111827; font-size: 13.5px; }

.pay-divider { height: 1px; background: #e5e7eb; margin: 2px 0; }
.pay-total-row { margin-top: 2px; }
.pay-total-label { font-size: 14px; font-weight: 700; color: #111827; }
.pay-total-val { font-size: 16px; font-weight: 800; letter-spacing: -0.5px; transition: color 0.2s; }

/* ── Print Alert ── */
.print-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fff5f5;
  border: 0.5px solid #feb2b2;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #c53030;
}

.print-error-tag {
  display: inline-block;
  background: #fed7d7;
  color: #9b2c2c;
  border-radius: 4px;
  padding: 1px 8px;
  font-size: 12px;
  margin-left: 6px;
}

/* ── Action Buttons ── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  border: 0.5px solid;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.btn-action:active { transform: scale(0.97); }

.btn-reset {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-reset:hover { background: #f9fafb; }

.btn-save {
  background: #fff;
}

.btn-save:hover { opacity: 0.85; }

.btn-print {
  color: #fff;
}

.btn-print:hover { opacity: 0.88; }

/* ── Responsive ── */
@media (max-width: 639px) {
  .fields-grid { grid-template-columns: 1fr; }
  .info-panels { grid-template-columns: 1fr; }
  .form-body { padding: 14px; gap: 14px; }
  .hide-xs { display: none; }
  .pay-summary { min-width: 0; width: 100%; }
  .summary-section { flex-direction: column; align-items: stretch; }
  .adj-row { justify-content: stretch; }
  .adj-item { flex: 1; width: auto; }
  .form-actions { justify-content: stretch; }
  .btn-action { flex: 1; justify-content: center; }
}

@media (min-width: 640px) and (max-width: 899px) {
  .fields-grid { grid-template-columns: 1fr 1fr; }
  .info-panels { grid-template-columns: 1fr 1fr; }
}

/* ── Print styles ── */
@media print {
  .form-titlebar .titlebar-right,
  .form-titlebar .title-icon,
  .ref-copy-btn,
  .customer-add-btn,
  .print-alert,
  .form-actions,
  .adj-row,
  .items-wrap .table-footer {
    display: none !important;
  }

  .form-card {
    box-shadow: none;
    border-radius: 0;
  }

  .form-body { padding: 12px; }

  .field-input,
  .field-select,
  .field-textarea {
    border-color: #e2e8f0 !important;
    box-shadow: none !important;
  }
}
</style>
