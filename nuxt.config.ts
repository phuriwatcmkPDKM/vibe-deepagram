import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
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
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
});
