<script setup lang="ts">
// Apply auth middleware
definePageMeta({
  middleware: ["auth"],
});

const schemaStore = useSchemaStore();

// Mock loading state for 1 seconds
const isLoading = ref(true);
const loadingProgress = ref(0);

onMounted(() => {
  // Animate progress from 0% to 100% over 1 seconds
  const duration = 1000; // 1 seconds
  const interval = 50; // Update every 50ms
  const increment = 100 / (duration / interval); // Calculate increment per interval

  const progressInterval = setInterval(() => {
    loadingProgress.value = Math.min(loadingProgress.value + increment, 100);

    if (loadingProgress.value >= 100) {
      clearInterval(progressInterval);
    }
  }, interval);

  // Load sample data and hide loading after 2.5 seconds
  setTimeout(() => {
    schemaStore.parseSchemaData(schemaStore.getSampleData());
    isLoading.value = false;
  }, duration);
});

// Set page title
useHead({
  title: "Cortex - canvas",
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <HeaderBar is-sample />
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

          <!-- Progress Indicator -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              class="bg-ci-primary h-2 rounded-full transition-all duration-100 ease-out"
              :style="{ width: `${loadingProgress}%` }"
            />
          </div>

          <!-- Progress Percentage -->
          <div class="text-sm text-gray-500 font-medium">
            {{ Math.round(loadingProgress) }}%
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
