<script setup>
import { ref, computed, provide } from "vue";
import { brands } from "./data/brand.js";
import SaleOrderForm from "./components/Saleorderform.vue";

import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const selectedBrandId = ref(brands[0].id);
const selectedBrand = computed(() => brands.find((b) => b.id === selectedBrandId.value));

const toast = useToast();
const showToast = (message, type = "success") => {
  toast.add({ 
    severity: type === 'error' ? 'error' : (type === 'info' ? 'info' : 'success'), 
    summary: type.charAt(0).toUpperCase() + type.slice(1), 
    detail: message, 
    life: 3000 
  });
};
provide("showToast", showToast);
</script>

<template>
  <div class="app-shell">
    <header class="topbar" :style="{ '--brand': selectedBrand.color }">
      <div class="topbar-left">
        <div class="app-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <span class="app-name">Sale Order</span>
      </div>

    </header>

    <main class="page-content">
      <SaleOrderForm :brand="selectedBrand" :key="selectedBrand.id" />
    </main>

    <Toast />
  </div>
</template>

<style src="./styles/App.css"></style>
