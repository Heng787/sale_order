<script setup>
import { ref, computed, watch } from "vue";

const filteredProducts = ref([]);
const searchProduct = (event) => {
  const query = event.query || '';
  filteredProducts.value = props.brand?.products?.map(p => p.name).filter((name) => {
    return name.toLowerCase().includes(query.toLowerCase());
  }) || [];
};

const props = defineProps({ brand: Object });
const emit = defineEmits(["update:totals"]);

const items = ref([{ id: 1, item: "", memo: "", qty: "", uom: "", price: "" }]);
let nextId = 2;

const addRow = () => {
  items.value.push({ id: nextId++, item: "", memo: "", qty: "", uom: "", price: "" });
};

const removeRow = (id) => {
  if (items.value.length > 1)
    items.value = items.value.filter((i) => i.id !== id);
};

const onItemChange = (row) => {
  const product = props.brand?.products?.find((p) => p.name === row.item);
  if (product) {
    row.uom = product.uom;
    row.price = product.price;
    if (!row.qty || row.qty === 0 || row.qty === "") {
      row.qty = 1;
    }
  }
};

const getAmount = (row) => {
  const q = parseFloat(row.qty) || 0;
  const p = parseFloat(row.price) || 0;
  return (q * p).toFixed(2);
};

const totalQty = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0),
);

const totalAmount = computed(() =>
  items.value
    .reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0)
    .toFixed(2),
);

watch(
  [totalQty, totalAmount],
  ([qty, amount]) => {
    emit("update:totals", { qty, amount });
  },
  { immediate: true },
);
</script>

<template>
  <div class="items-wrap">
    <div class="items-header">
      <span class="items-label">Item:</span>
      <span class="currency-badge" :style="{ background: brand?.color || '#2563eb' }">USD</span>
    </div>



    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-no">NO</th>
            <th class="col-item">ITEM</th>
            <th class="col-memo">MEMO</th>
            <th class="col-qty">QTY</th>
            <th class="col-uom">UOM</th>
            <th class="col-price">PRICE</th>
            <th class="col-amount">AMOUNT</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in items" :key="row.id" class="item-row">
            <td class="col-no">
              <span class="row-num" :style="{ background: brand?.color || '#2563eb' }">{{ index + 1 }}</span>
            </td>
            <td class="col-item">
              <AutoComplete size="small"
                v-model="row.item"
                :suggestions="filteredProducts"
                @complete="searchProduct"
                @item-select="onItemChange(row)"
                @change="onItemChange(row)"
                placeholder="Search or type…"
                dropdown
                fluid
              />
            </td>
            <td class="col-memo">
              <InputText size="small"
                v-model="row.memo"
                placeholder=""
                fluid
              />
            </td>
            <td class="col-qty">
              <InputNumber size="small"
                v-model="row.qty"
                :min="0"
                placeholder="0"
                fluid
              />
            </td>
            <td class="col-uom">
              <InputText size="small"
                v-model="row.uom"
                placeholder=""
                fluid
              />
            </td>
            <td class="col-price">
              <InputNumber size="small"
                v-model="row.price"
                :min="0"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                mode="decimal"
                fluid
              />
            </td>
            <td class="col-amount">
              <span class="amount-val">{{ getAmount(row) }}</span>
            </td>
            <td class="col-action">
              <Button icon="pi pi-times" severity="danger" text rounded aria-label="Remove" @click="removeRow(row.id)" title="Remove row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <div class="footer-left">
        <Button size="small" outlined label="New" icon="pi pi-plus" @click="addRow" :style="{ color: brand?.color || '#2563eb', borderColor: brand?.color || '#2563eb' }" class="add-new-btn" />
      </div>
      <div class="footer-right">
        <div class="total-box">
          <span class="total-label">Total Qty</span>
          <span class="total-divider">:</span>
          <span class="total-val">{{ totalQty }}</span>
        </div>
        <div class="total-box total-box-amount">
          <span class="total-label">Total</span>
          <span class="total-divider">:</span>
          <span class="total-val">${{ totalAmount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-wrap {
  margin-top: 4px;
}

.items-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.items-label {
  font-size: 13px;
  font-weight: 700;
  color: v-bind("brand?.color || '#2563eb'");
  font-family: "DM Sans", sans-serif;
  letter-spacing: 0.3px;
}

.currency-badge {
  font-size: 10.5px;
  font-weight: 600;
  color: white;
  padding: 1px 8px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
  min-width: 560px;
}

thead tr {
  background: #f8fafc;
}

th {
  padding: 4px 6px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.item-row td {
  padding: 4px 6px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.item-row:last-child td {
  border-bottom: none;
}

.item-row:hover td {
  background: #fafbff;
}

.row-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: white;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  transition: background 0.2s;
}

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 5px;
  padding: 5px 7px;
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
  background: transparent;
  color: #1f2937;
  transition: all 0.15s;
  outline: none;
  box-sizing: border-box;
}

.cell-input:hover {
  border-color: #d1d5db;
  background: #fff;
}

.cell-input:focus {
  border-color: var(--brand, #2563eb);
  background: #fff;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand, #2563eb) 10%, transparent);
}

.num-input {
  text-align: right;
}

.amount-val {
  font-weight: 600;
  color: #111827;
  font-size: 13px;
  display: block;
  text-align: right;
  padding-right: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #c4c9d4;
  cursor: pointer;
  padding: 4px 5px;
  border-radius: 4px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.remove-btn:active {
  transform: scale(0.95);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 11px;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-left {
  display: flex;
  gap: 1px;
}

.add-btn {
  color: white;
  border: none;
  padding: 7px 16px;
  font-size: 13px;
  font-family: "DM Sans", sans-serif;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px 0 0 6px;
  transition: opacity 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-btn:hover {
  opacity: 0.85;
}

.add-icon {
  font-size: 16px;
  font-weight: 300;
  line-height: 1;
}

.dropdown-btn {
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  padding: 7px 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, transform 0.15s;
}

.add-btn:active,
.dropdown-btn:active {
  transform: scale(0.95);
}

.dropdown-btn:hover {
  opacity: 0.85;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-box {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12.5px;
  font-family: "DM Sans", sans-serif;
}

.total-box-amount {
  background: #fff8f0;
  border-color: #fde8c8;
}

.total-label {
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.total-divider {
  color: #9ca3af;
}

.total-val {
  font-weight: 700;
  color: #111827;
  min-width: 40px;
  text-align: right;
}

.col-no { width: 46px; }
.col-memo { width: 140px; }
.col-qty { width: 80px; }
.col-uom { width: 72px; }
.col-price { width: 96px; }
.col-amount { width: 96px; }
.col-action { width: 36px; }
</style>
