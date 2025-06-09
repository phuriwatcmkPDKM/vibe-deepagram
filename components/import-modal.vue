<script setup lang="ts">
import type { DatabaseType } from "~/types/schema";

interface Props {
  isOpen?: boolean;
}

interface Emits {
  (e: "close" | "import"): void;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
});

const emit = defineEmits<Emits>();

const schemaStore = useSchemaStore();
const schemaInput = ref<string>("");
const selectedDbType = ref<DatabaseType>("postgresql");

const closeModal = (): void => {
  emit("close");
};

const loadSampleData = (): void => {
  schemaInput.value = schemaStore.getSampleData();
};

const clearInput = (): void => {
  schemaInput.value = "";
};

const importSchema = (): void => {
  if (!schemaInput.value.trim()) return;

  schemaStore.parseSchemaData(schemaInput.value);
  emit("import");
  closeModal();
};

// Close on Escape key
onKeyStroke("Escape", () => {
  if (props.isOpen) {
    closeModal();
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div
      class="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <h2 class="text-xl font-semibold text-gray-900">
          Import Database Schema
        </h2>
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          @click="closeModal"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto">
        <!-- Database Type Selector -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Database Type</label
          >
          <select
            v-model="selectedDbType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        <!-- Format Info -->
        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 class="text-sm font-medium text-blue-900 mb-2">
            Expected Format
          </h3>
          <code class="text-xs text-blue-800 break-all">
            database,schema,table,column,position,datatype,length,constraints,foreign_table,foreign_column
          </code>
        </div>

        <!-- Schema Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Schema Data</label
          >
          <textarea
            v-model="schemaInput"
            class="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="Paste your schema data here..."
          />
        </div>

        <!-- Quick Actions -->
        <div class="flex gap-2 mb-6">
          <button class="btn-secondary text-sm" @click="loadSampleData">
            Load Sample Data
          </button>
          <button class="btn-secondary text-sm" @click="clearInput">
            Clear
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50"
      >
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button
          :disabled="!schemaInput.trim()"
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          @click="importSchema"
        >
          Import Schema
        </button>
      </div>
    </div>
  </div>
</template>
