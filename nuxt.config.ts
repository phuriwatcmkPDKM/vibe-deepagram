import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
      authUrl: process.env.AUTH_URL ?? "/set-token",
      accessTokenCookieName:
        process.env.ACCESS_TOKEN_COOKIE_NAME ?? "accessToken",
      refreshTokenCookieName:
        process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken",
    },
  },
  app: {
    head: {
      title: "Cortex Canvas",
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
  css: ["~/assets/css/main.css", "~/assets/css/variables.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    typeCheck: true,
  },
  modules: [
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxt/test-utils",
    "@nuxt/test-utils/module",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
});
