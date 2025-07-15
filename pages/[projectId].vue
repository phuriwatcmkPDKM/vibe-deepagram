<script setup lang="ts">
// Apply auth middleware
definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const projectId = route.params.projectId as string;
const { data, isLoading, error, refresh } = useErMigration(projectId);

const schemaStore = useSchemaStore();

// Watch for data changes and parse schema when data loads
watch(
  data,
  (newData) => {
    if (newData?.erCsvImport) {
      schemaStore.parseSchemaData(newData.erCsvImport);
    }
  },
  { immediate: true }
);

// Set page title
useHead({
  title: "Cortex - canvas",
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <HeaderBar />
    <!-- Loading State -->
    <template v-if="isLoading">
      <div
        class="h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div class="max-w-md mx-auto text-center">
          <!-- Loading Spinner -->
          <div class="mb-8">
            <div class="relative w-20 h-20 mx-auto">
              <!-- Outer ring -->
              <div
                class="absolute inset-0 rounded-full border-4 border-gray-200"
              />

              <!-- Animated ring -->
              <div
                class="absolute inset-0 rounded-full border-4 border-transparent border-t-ci-primary border-r-ci-primary/70 animate-spin"
              />

              <!-- Inner pulsing dot -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-3 h-3 bg-ci-primary rounded-full animate-pulse" />
              </div>

              <!-- Outer glow effect -->
              <div
                class="absolute inset-0 rounded-full border-2 border-ci-primary/30 animate-ping opacity-20"
              />
            </div>
          </div>

          <!-- Loading Text -->
          <h2 class="text-2xl font-semibold text-gray-900 mb-3">
            Loading Schema
          </h2>
          <p class="text-gray-600 mb-8">
            We're fetching your database schema and preparing the
            visualization...
          </p>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <template v-else-if="error || !data?.erCsvImport">
      <div
        class="h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <div class="max-w-md mx-auto text-center">
          <!-- Error Icon -->
          <div class="mb-8">
            <div
              class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          <!-- Error Text -->
          <h2 class="text-2xl font-semibold text-gray-900 mb-3">
            Unable to Load Schema
          </h2>
          <p class="text-gray-600 mb-8">
            {{
              error?.message ||
              "We encountered an issue while loading your database schema. Please try again or contact support if the problem persists."
            }}
          </p>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              class="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              @click="refresh"
            >
              Try Again
            </button>
            <button
              class="cursor-pointer px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              @click="navigateTo('/', { replace: true })"
            >
              Go to Sample
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Main Content -->
    <template v-else>
      <!-- Canvas -->
      <main class="flex-1 relative">
        <schema-canvas />
      </main>
    </template>
  </div>
</template>
