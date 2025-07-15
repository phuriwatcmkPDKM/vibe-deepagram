<script setup lang="ts">
const schemaStore = useSchemaStore();
const { tables, relationships, canvas } = storeToRefs(schemaStore);

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
  title: "Cortex - ER Diagram canvas",
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Toolbar -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-6">
          <h1 class="text-xl font-bold text-gray-900">Cortex canvas</h1>

          <div class="flex items-center gap-3">
            <button class="btn-primary text-sm" @click="showImportModal = true">
              Import Schema
            </button>

            <button class="btn-secondary text-sm" @click="loadSample">
              Load Sample
            </button>

            <button class="btn-secondary text-sm" @click="clearAll">
              Clear
            </button>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <!-- Mode Toggle Switch -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-700">Modern</span>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :class="canvas.isClassicMode ? 'bg-ci-primary' : 'bg-gray-200'"
              :aria-label="
                canvas.isClassicMode
                  ? 'Switch to Modern Mode'
                  : 'Switch to Classic Mode'
              "
              @click="toggleGovernmentMode"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="
                  canvas.isClassicMode ? 'translate-x-6' : 'translate-x-1'
                "
              />
            </button>
            <span class="text-sm font-medium text-gray-700">Classic</span>
          </div>
          <!-- Schema Info -->
          <div class="text-sm text-gray-600">
            {{ tables.length }} tables, {{ relationships.length }} relationships
          </div>
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
