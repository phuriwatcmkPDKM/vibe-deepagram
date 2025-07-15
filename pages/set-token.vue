<script setup lang="ts">
// This page handles authentication setup
// It's the fallback when no external auth URL is configured

const { setToken, setRefreshToken } = useToken();
const route = useRoute();
const router = useRouter();

// Handle token from URL parameters (if passed from external auth)
onMounted(() => {
  const urlToken = route.query.token as string;
  const urlRefreshToken = route.query.refreshToken as string;

  if (urlToken) {
    setToken(urlToken);
    if (urlRefreshToken) {
      setRefreshToken(urlRefreshToken);
    }

    // Redirect to main page after setting token
    const redirectUrl = route.query.redirect_url as string;
    router.push(redirectUrl || "/");
  }
});

// For development/testing - manual token input
const tokenInput = ref("");
const refreshTokenInput = ref("");

const handleSetToken = () => {
  if (tokenInput.value) {
    setToken(tokenInput.value);
    if (refreshTokenInput.value) {
      setRefreshToken(refreshTokenInput.value);
    }
    router.push("/");
  }
};

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
          >
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Authentication Required
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please set your authentication token to continue
        </p>
      </div>

      <div class="mt-8 space-y-6">
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
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your access token"
            >
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
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your refresh token"
            >
          </div>
        </div>

        <div>
          <button
            :disabled="!tokenInput"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ci-primary hover:bg-ci-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ci-primary disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSetToken"
          >
            Continue to Canvas
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
