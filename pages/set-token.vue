<script setup lang="ts">
import { validateJWTToken, validateRedirectUrl } from "~/utils";

const { setToken, setRefreshToken } = useToken();
const route = useRoute();
const router = useRouter();

// Reactive state
const tokenInput = ref("");
const refreshTokenInput = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

// Clear error message
const clearError = () => {
  errorMessage.value = "";
};

// Handle URL token processing
const processUrlTokens = async () => {
  const urlToken = route.query.token as string;
  const urlRefreshToken = route.query.refreshToken as string;
  const redirectUrl = route.query.redirect_url as string;

  if (!urlToken) return;

  try {
    isLoading.value = true;

    // Validate access token
    const tokenValidation = validateJWTToken(urlToken);
    if (!tokenValidation.isValid) {
      throw new Error(`Invalid access token: ${tokenValidation.error}`);
    }

    // Validate refresh token if provided
    if (urlRefreshToken) {
      const refreshTokenValidation = validateJWTToken(urlRefreshToken);
      if (!refreshTokenValidation.isValid) {
        throw new Error(
          `Invalid refresh token: ${refreshTokenValidation.error}`
        );
      }
    }

    // Validate redirect URL
    let safeRedirectUrl = "/";
    if (redirectUrl) {
      const redirectValidation = validateRedirectUrl(redirectUrl);
      if (redirectValidation.isValid) {
        safeRedirectUrl = redirectUrl;
      }
      // If redirect URL is invalid, we'll use default but won't throw error
    }

    // Set tokens
    setToken(urlToken);
    if (urlRefreshToken) {
      setRefreshToken(urlRefreshToken);
    }

    // Redirect after successful token setting
    await router.push(safeRedirectUrl);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Failed to process authentication tokens";
  } finally {
    isLoading.value = false;
  }
};

// Handle manual token input
const handleManualTokenInput = async () => {
  if (!tokenInput.value.trim()) {
    errorMessage.value = "Please enter an access token";
    return;
  }

  try {
    isLoading.value = true;
    clearError();

    // Validate access token
    const tokenValidation = validateJWTToken(tokenInput.value);
    if (!tokenValidation.isValid) {
      throw new Error(tokenValidation.error);
    }

    // Validate refresh token if provided
    if (refreshTokenInput.value.trim()) {
      const refreshTokenValidation = validateJWTToken(refreshTokenInput.value);
      if (!refreshTokenValidation.isValid) {
        throw new Error(`Refresh token error: ${refreshTokenValidation.error}`);
      }
    }

    // Set tokens
    setToken(tokenInput.value.trim());
    if (refreshTokenInput.value.trim()) {
      setRefreshToken(refreshTokenInput.value.trim());
    }

    // Redirect to main page
    await router.push("/");
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Failed to set authentication tokens";
  } finally {
    isLoading.value = false;
  }
};

// Handle token processing on mount
onMounted(() => {
  processUrlTokens();
});

// Watch for input changes to clear errors
watch([tokenInput, refreshTokenInput], () => {
  if (errorMessage.value) {
    clearError();
  }
});

// Set page title
useHead({
  title: "Set Token - Cortex Canvas",
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-16 w-auto flex items-center justify-center">
          <img
            src="~/assets/images/cortex-logo-black.png"
            alt="Cortex Logo"
            class="h-16 w-auto"
          />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Required
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please set your authentication token to continue
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="rounded-md bg-red-50 p-4 border border-red-200"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">
              {{ errorMessage }}
            </p>
          </div>
          <div class="ml-auto pl-3">
            <button
              class="inline-flex text-red-400 hover:text-red-600"
              @click="clearError"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center">
        <div class="inline-flex items-center px-4 py-2 text-sm text-gray-600">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing authentication...
        </div>
      </div>

      <!-- Token Input Form -->
      <div v-if="!isLoading" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="token" class="block text-sm font-medium text-gray-700">
              Access Token
            </label>
            <input
              id="token"
              v-model="tokenInput"
              type="text"
              required
              autocomplete="off"
              :class="[
                'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2',
                errorMessage && errorMessage.includes('access token')
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
              ]"
              placeholder="Enter your access token"
            />
          </div>

          <div>
            <label
              for="refresh-token"
              class="block text-sm font-medium text-gray-700"
            >
              Refresh Token (Optional)
            </label>
            <input
              id="refresh-token"
              v-model="refreshTokenInput"
              type="text"
              autocomplete="off"
              :class="[
                'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2',
                errorMessage && errorMessage.includes('refresh token')
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
              ]"
              placeholder="Enter your refresh token"
            />
          </div>
        </div>

        <div>
          <button
            :disabled="!tokenInput.trim() || isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ci-primary hover:bg-ci-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ci-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="handleManualTokenInput"
          >
            <span
              v-if="isLoading"
              class="absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <svg
                class="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            {{ isLoading ? "Processing..." : "Continue to Canvas" }}
          </button>
        </div>

        <div class="text-center">
          <p class="text-xs text-gray-500">
            This token will be stored securely in your browser cookies
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
