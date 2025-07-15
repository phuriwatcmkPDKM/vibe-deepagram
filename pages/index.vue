<script setup lang="ts">
import type { DatabaseType } from "~/types/schema";

const schemaStore = useSchemaStore();
const { tables, relationships, canvas } = storeToRefs(schemaStore);

const selectedDbType = ref<DatabaseType>("postgresql");
const showImportModal = ref<boolean>(false);

const loadSample = (): void => {
  schemaStore.parseSchemaData(schemaStore.getSampleData());
};

const clearAll = (): void => {
  schemaStore.clearSchema();
};

const handleImport = (): void => {
  // Additional handling after import if needed
  console.log("Schema imported successfully");
};

const toggleGovernmentMode = (): void => {
  schemaStore.setGovernmentMode(!canvas.value.isClassicMode);
};

// Set page title
useHead({
  title: "Database Schema Canvas - Nuxt 3",
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Toolbar -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-6">
          <h1 class="text-xl font-bold text-gray-900">Schema Canvas</h1>

          <div class="flex items-center gap-3">
            <select
              v-model="selectedDbType"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>

            <button class="btn-primary text-sm" @click="showImportModal = true">
              Import Schema
            </button>

            <button class="btn-secondary text-sm" @click="loadSample">
              Load Sample
            </button>

            <button class="btn-secondary text-sm" @click="clearAll">
              Clear
            </button>

            <button
              class="btn-secondary text-sm"
              :class="{ 'bg-gray-800 text-white': canvas.isClassicMode }"
              @click="toggleGovernmentMode"
            >
              {{
                canvas.isClassicMode ? "Exit Classic Mode" : "Classic Diagram"
              }}
            </button>
          </div>
        </div>

        <!-- Schema Info -->
        <div class="text-sm text-gray-600">
          {{ tables.length }} tables, {{ relationships.length }} relationships
        </div>
      </div>
    </header>

    <!-- Canvas -->
    <main class="flex-1 relative">
      <schema-canvas />
    </main>

    <!-- Import Modal -->
    <import-modal
      :is-open="showImportModal"
      @close="showImportModal = false"
      @import="handleImport"
    />
  </div>
</template>
